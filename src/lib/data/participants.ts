import type { SupabaseClient } from "@supabase/supabase-js";
import { mapOrder, mapParticipant, mapPointLog } from "@/lib/data/mappers";
import { getMarketOwnerPlan } from "@/lib/data/plans";
import { resolveDisplayName } from "@/lib/resolve-display-name";

export async function getMarketParticipantUsage(
  supabase: SupabaseClient,
  marketId: string,
) {
  const [plan, { count }] = await Promise.all([
    getMarketOwnerPlan(supabase, marketId),
    supabase
      .from("market_participants")
      .select("id", { count: "exact", head: true })
      .eq("market_id", marketId),
  ]);
  return { count: count ?? 0, limit: plan.participantLimit };
}

export async function joinMarket(
  supabase: SupabaseClient,
  marketId: string,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("market_participants")
    .select("id, display_name, user:users!user_id(real_name)")
    .eq("market_id", marketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // supabase-js infers `user:users!user_id(...)` as a to-many array (it can't see the
    // FK's one-to-one cardinality without generated Database types) - it's actually a
    // single row at runtime, so index [0] instead of casting past the inferred type.
    const realName = existing.user?.[0]?.real_name ?? "";
    return {
      isNew: false,
      hasConflict: false,
      displayName: (existing.display_name as string | null) ?? realName,
    };
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("real_name")
    .eq("id", userId)
    .single();

  if (!userRow) throw new Error("User not found");
  const realName = userRow.real_name as string;

  const usage = await getMarketParticipantUsage(supabase, marketId);
  if (usage.limit !== null && usage.count >= usage.limit) {
    throw new Error("마켓 참가자 정원이 가득 찼어요");
  }

  const { data: others } = await supabase
    .from("market_participants")
    .select("display_name, user:users!user_id(real_name)")
    .eq("market_id", marketId);

  const existingNames = new Set(
    (others ?? [])
      .map((p) => {
        const dn = p.display_name as string | null;
        const rn = p.user?.[0]?.real_name ?? null;
        return dn ?? rn ?? "";
      })
      .filter(Boolean),
  );

  const { displayName, hasConflict } = resolveDisplayName(
    realName,
    existingNames,
  );

  await supabase.from("market_participants").insert({
    market_id: marketId,
    user_id: userId,
    role: "user",
    balance: 0,
    display_name: displayName,
  });

  return { isNew: true, hasConflict, displayName };
}

export async function listParticipants(
  supabase: SupabaseClient,
  marketId: string,
) {
  const { data, error } = await supabase
    .from("market_participants")
    .select("*, user:users!user_id(*), group:groups(name)")
    .eq("market_id", marketId)
    .order("real_name", { foreignTable: "users" });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapParticipant);
}

export async function getParticipant(
  supabase: SupabaseClient,
  marketId: string,
  userId: string,
) {
  const [{ data: p, error }, { data: logs }, { data: orders }] =
    await Promise.all([
      supabase
        .from("market_participants")
        .select("*, user:users!user_id(*), group:groups(name)")
        .eq("market_id", marketId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("point_logs")
        .select("*")
        .eq("market_id", marketId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("*")
        .eq("market_id", marketId)
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false }),
    ]);
  if (error || !p) throw new Error("Not found");
  return {
    participant: mapParticipant(p),
    pointLogs: (logs ?? []).map(mapPointLog),
    orders: (orders ?? []).map(mapOrder),
  };
}
