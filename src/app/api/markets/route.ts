import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { mapMarket } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = authRoute(async (_req, { supabase, userId }) => {
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
  if (error) return err(error.message);

  const joinedIds = new Set((myParticipations ?? []).map((p) => p.market_id));

  return ok(
    (markets ?? []).map((m) => {
      const counts = m.market_participants as unknown as { count: number }[];
      return {
        market: mapMarket(m as Record<string, unknown>),
        participantCount: counts?.[0]?.count ?? 0,
        isJoined: joinedIds.has(m.id as string),
      };
    }),
  );
});
