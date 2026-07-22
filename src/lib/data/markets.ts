import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMarket } from "@/lib/db";

// ponytail: PWA 오프라인 QA용 "DEV TEST" 마켓 — 개발 계정에만 보이면 되는 일회성
// 케이스라 별도 visibility 컬럼/기능 없이 하드코딩으로 막는다. 나중에 실제로
// 마켓별 노출 제어가 필요해지면 그때 제대로 된 컬럼을 추가할 것.
const DEV_ONLY_MARKET_ID = "oxzO6tplee";
const DEV_USER_ID = "06c33cbf-1b3f-4043-b23a-0177fa743dbe";

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

  return (markets ?? [])
    .filter((m) => m.id !== DEV_ONLY_MARKET_ID || userId === DEV_USER_ID)
    .map((m) => ({
      market: mapMarket(m as Record<string, unknown>),
      participantCount: m.market_participants?.[0]?.count ?? 0,
      isJoined: joinedIds.has(m.id as string),
    }));
}
