import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMarket } from "@/lib/data/mappers";
import { getUserPlan } from "@/lib/data/plans";

// ponytail: PWA 오프라인 QA용 "DEV TEST" 마켓 - 개발 계정에만 보이면 되는 일회성
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

export async function isMarketParticipant(
  supabase: SupabaseClient,
  marketId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("market_participants")
    .select("id")
    .eq("market_id", marketId)
    .eq("user_id", userId)
    .maybeSingle();
  return data !== null;
}

// 로그인 전 방문자(QR 랜딩)도 봐야 하는 공개 화면용 - getMarket과 달리 없으면
// throw 대신 null을 돌려줘서 페이지가 조용히 처리할 수 있게 한다.
export async function getMarketWithParticipantCount(
  supabase: SupabaseClient,
  marketId: string,
) {
  const [{ data: marketRow }, { count }] = await Promise.all([
    supabase.from("markets").select("*").eq("id", marketId).single(),
    supabase
      .from("market_participants")
      .select("*", { count: "exact", head: true })
      .eq("market_id", marketId),
  ]);
  if (!marketRow) return null;
  return {
    market: mapMarket(marketRow as Record<string, unknown>),
    participantCount: count ?? 0,
    isDeleted: marketRow.deleted_at !== null,
  };
}

export async function listMarkets(supabase: SupabaseClient, userId: string) {
  const [{ data: markets, error }, { data: myParticipations }] =
    await Promise.all([
      supabase
        .from("markets")
        .select("*, market_participants(count)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("market_participants")
        .select("market_id")
        .eq("user_id", userId),
    ]);
  if (error) throw new Error(error.message);

  const joinedIds = new Set((myParticipations ?? []).map((p) => p.market_id));

  return (markets ?? [])
    .filter((m) => joinedIds.has(m.id as string))
    .filter((m) => m.id !== DEV_ONLY_MARKET_ID || userId === DEV_USER_ID)
    .map((m) => ({
      market: mapMarket(m as Record<string, unknown>),
      participantCount: m.market_participants?.[0]?.count ?? 0,
    }));
}

export async function getOwnedMarketUsage(
  supabase: SupabaseClient,
  userId: string,
) {
  const [plan, { count }] = await Promise.all([
    getUserPlan(supabase, userId),
    supabase
      .from("market_participants")
      .select("id, markets!inner(deleted_at)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "owner")
      .is("markets.deleted_at", null),
  ]);
  return { owned: count ?? 0, limit: plan.marketLimit };
}

export async function canCreateMarket(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { owned, limit } = await getOwnedMarketUsage(supabase, userId);
  return limit === null || owned < limit;
}

// 마켓 수정 화면(owner 전용) 전용 - admin_code를 포함하므로 공개 getMarket과
// 분리한다. GET /api/markets/:marketId는 인증 없는 QR 랜딩 페이지도 호출하는
// 공개 라우트라 admin_code를 여기 섞으면 안 된다.
export async function getMarketForOwner(
  supabase: SupabaseClient,
  marketId: string,
) {
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .single();
  if (error || !data) throw new Error("Not found");
  return {
    ...mapMarket(data as Record<string, unknown>),
    adminCode: data.admin_code as string,
  };
}
