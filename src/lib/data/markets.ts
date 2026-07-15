import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMarket } from "@/lib/db";

export async function getMarket(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .single();
  if (error || !data) throw new Error("Not found");
  return mapMarket(data as Record<string, unknown>);
}

export async function listMarkets(supabase: SupabaseClient, userId: string) {
  const [{ data: markets, error }, { data: myParticipations }] =
    await Promise.all([
      supabase
        .from("markets")
        .select("*, market_participants(count)")
        .order("created_at", { ascending: false }),
      supabase
        .from("market_participants")
        .select("market_id")
        .eq("user_id", userId),
    ]);
  if (error) throw new Error(error.message);

  const joinedIds = new Set((myParticipations ?? []).map((p) => p.market_id));

  return (markets ?? []).map((m) => {
    const counts = m.market_participants as unknown as { count: number }[];
    return {
      market: mapMarket(m as Record<string, unknown>),
      participantCount: counts?.[0]?.count ?? 0,
      isJoined: joinedIds.has(m.id as string),
    };
  });
}
