import type { SupabaseClient } from "@supabase/supabase-js";
import { mapOrder, mapParticipant, mapPointLog } from "@/lib/db";

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
    const realName =
      (existing as unknown as { user?: { real_name?: string } }).user
        ?.real_name ?? "";
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

  const { data: others } = await supabase
    .from("market_participants")
    .select("display_name, user:users!user_id(real_name)")
    .eq("market_id", marketId);

  const existingNames = new Set(
    (others ?? [])
      .map((p) => {
        const dn = p.display_name as string | null;
        const rn =
          (p as unknown as { user?: { real_name?: string } }).user?.real_name ??
          null;
        return dn ?? rn ?? "";
      })
      .filter(Boolean),
  );

  let displayName = realName;
  let hasConflict = false;

  if (existingNames.has(realName)) {
    hasConflict = true;
    for (const suffix of "BCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const candidate = `${realName}${suffix}`;
      if (!existingNames.has(candidate)) {
        displayName = candidate;
        break;
      }
    }
  }

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
    .select("*, user:users!user_id(*)")
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
        .select("*, user:users!user_id(*)")
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
