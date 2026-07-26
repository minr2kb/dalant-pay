import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPointLog } from "@/lib/db";

export async function listPointLogs(
  supabase: SupabaseClient,
  marketId: string,
  opts?: { userId?: string },
) {
  let query = supabase
    .from("point_logs")
    .select("*, mission_logs(photo_url, slot, verified_by)")
    .eq("market_id", marketId)
    .order("created_at", { ascending: false });
  if (opts?.userId) query = query.eq("user_id", opts.userId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapPointLog(r as Record<string, unknown>));
}

// 랭킹용 누적 획득량 — 미션 보상 + 수동 지급(관리자 차감 포함)만 합산.
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

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    totals.set(userId, (totals.get(userId) ?? 0) + (row.amount as number));
  }
  return Array.from(totals, ([userId, earned]) => ({ userId, earned }));
}

export async function listRecentMissionLogs(
  supabase: SupabaseClient,
  marketId: string,
  limit = 10,
) {
  const { data, error } = await supabase
    .from("point_logs")
    .select("*, mission_logs(photo_url, slot, verified_by)")
    .eq("market_id", marketId)
    .eq("reason_type", "mission")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapPointLog(r as Record<string, unknown>));
}
