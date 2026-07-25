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
