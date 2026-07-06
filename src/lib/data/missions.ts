import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMission, mapPendingMissionLog } from "@/lib/db";
import { getMissionStatus } from "@/types";

export async function listMissions(
  supabase: SupabaseClient,
  marketId: string,
  opts?: { userId?: string; status?: "active" | "upcoming" | "past" },
) {
  const { data: missions, error } = await supabase
    .from("missions")
    .select("*")
    .eq("market_id", marketId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);

  let logs: Record<string, unknown>[] = [];
  if (opts?.userId && missions?.length) {
    const { data } = await supabase
      .from("mission_logs")
      .select("*")
      .in(
        "mission_id",
        missions.map((m) => m.id),
      )
      .eq("user_id", opts.userId);
    logs = (data ?? []) as Record<string, unknown>[];
  }

  let result = (missions ?? []).map((m) =>
    mapMission(m as Record<string, unknown>, logs),
  );
  if (opts?.status)
    result = result.filter((m) => getMissionStatus(m) === opts.status);
  return result;
}

export async function getMission(
  supabase: SupabaseClient,
  missionId: string,
  opts?: { userId?: string },
) {
  const [{ data: mission, error }, logsResult] = await Promise.all([
    supabase.from("missions").select("*").eq("id", missionId).single(),
    opts?.userId
      ? supabase
          .from("mission_logs")
          .select("*")
          .eq("mission_id", missionId)
          .eq("user_id", opts.userId)
      : Promise.resolve({ data: null }),
  ]);
  if (error || !mission) throw new Error("Not found");
  const logs = (logsResult.data ?? []) as Record<string, unknown>[];
  return mapMission(mission as Record<string, unknown>, logs);
}

export async function listPendingMissionLogs(
  supabase: SupabaseClient,
  marketId: string,
) {
  const { data, error } = await supabase
    .from("mission_logs")
    .select(
      "id, mission_id, user_id, slot, photo_url, missions!inner(title, reward, market_id, is_group)",
    )
    .is("verified_at", null)
    .eq("missions.market_id", marketId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) =>
    mapPendingMissionLog(r as Record<string, unknown>),
  );
}
