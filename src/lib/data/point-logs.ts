import type { SupabaseClient } from "@supabase/supabase-js";
import { groupBy, sumBy } from "es-toolkit";
import { mapPointLog } from "@/lib/data/mappers";

export async function listPointLogs(
  supabase: SupabaseClient,
  marketId: string,
  opts?: { userId?: string; page?: number; pageSize?: number },
) {
  let query = supabase
    .from("point_logs")
    .select("*, mission_logs(photo_url, slot, verified_by)")
    .eq("market_id", marketId)
    .order("created_at", { ascending: false });
  if (opts?.userId) query = query.eq("user_id", opts.userId);
  // page/pageSize 둘 다 있을 때만 자르고, 없으면 기존처럼 전체 반환 - admin/home
  // 대시보드의 합계 계산은 여전히 전체 목록이 필요해서 그 호출부는 그대로 둔다.
  if (opts?.page !== undefined && opts?.pageSize !== undefined) {
    const from = opts.page * opts.pageSize;
    query = query.range(from, from + opts.pageSize - 1);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapPointLog(r as Record<string, unknown>));
}

// 랭킹용 누적 획득량 - 미션 보상 + 수동 지급(관리자 차감 포함)만 합산.
// 구매/전송은 성취와 무관해 제외하고, 철회된(voided_at) 내역은 반영된 적 없는 셈 치고 뺀다.
export async function listEarnedTotals(
  supabase: SupabaseClient,
  marketId: string,
) {
  const { data, error } = await supabase
    .from("point_logs")
    .select("user_id, amount")
    .eq("market_id", marketId)
    .in("reason_type", ["mission", "manual"])
    .is("voided_at", null);
  if (error) throw new Error(error.message);

  const byUser = groupBy(data ?? [], (row) => row.user_id as string);
  return Object.entries(byUser).map(([userId, rows]) => ({
    userId,
    earned: sumBy(rows, (row) => row.amount as number),
  }));
}

// 1일 이내 인증은 개수 제한 없이 전부 보여주되, 그게 5개가 안 되면 그 이전
// 기록까지 끌어와서 최소 5개는 맞춘다 (전체를 합쳐도 5개가 안 되면 있는 만큼만).
const RECENT_MISSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const RECENT_MISSION_MIN_COUNT = 5;

export async function listRecentMissionLogs(
  supabase: SupabaseClient,
  marketId: string,
) {
  const since = new Date(Date.now() - RECENT_MISSION_WINDOW_MS).toISOString();

  const { data: withinWindow, error } = await supabase
    .from("point_logs")
    .select("*, mission_logs(photo_url, slot, verified_by)")
    .eq("market_id", marketId)
    .eq("reason_type", "mission")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (withinWindow.length >= RECENT_MISSION_MIN_COUNT) {
    return withinWindow.map((r) => mapPointLog(r as Record<string, unknown>));
  }

  const { data: topUp, error: topUpError } = await supabase
    .from("point_logs")
    .select("*, mission_logs(photo_url, slot, verified_by)")
    .eq("market_id", marketId)
    .eq("reason_type", "mission")
    .order("created_at", { ascending: false })
    .limit(RECENT_MISSION_MIN_COUNT);
  if (topUpError) throw new Error(topUpError.message);
  return (topUp ?? []).map((r) => mapPointLog(r as Record<string, unknown>));
}
