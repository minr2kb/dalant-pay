import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { resolveNextSlot } from "@/lib/mission-slots";

const uploadPhotoParser = createParser(missionsRouter.endpoints.uploadPhoto);

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId }) => {
    const parsed = await parseRequest(uploadPhotoParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { missionId } = params;
    const { photoUrl } = parsed.body;

    const { data: mission } = await supabase
      .from("missions")
      .select("limit_count, is_active, active_from, active_until")
      .eq("id", missionId)
      .single();
    if (!mission) return err("미션을 찾을 수 없어요", 404);
    if (!mission.is_active) return err("비활성화된 미션이에요", 403);
    const now = new Date();
    if (mission.active_from && new Date(mission.active_from as string) > now)
      return err("아직 시작되지 않은 미션이에요", 403);
    if (mission.active_until && new Date(mission.active_until as string) < now)
      return err("종료된 미션이에요", 403);

    const { data: existingLogs } = await supabase
      .from("mission_logs")
      .select("slot, verified_at")
      .eq("mission_id", missionId)
      .eq("user_id", userId);

    const logs = (existingLogs ?? []).map((l) => ({
      slot: l.slot as number,
      verifiedAt: l.verified_at as string | null,
    }));
    const pendingLog = logs.find((l) => l.verifiedAt === null);

    if (pendingLog) {
      const { error } = await supabase
        .from("mission_logs")
        .update({ photo_url: photoUrl })
        .eq("mission_id", missionId)
        .eq("user_id", userId)
        .eq("slot", pendingLog.slot);
      if (error) return err("업로드에 실패했어요", 500);
      return ok({ slot: pendingLog.slot, photoUrl });
    }

    const verifiedCount = logs.filter((l) => l.verifiedAt !== null).length;
    if (mission.limit_count !== null && verifiedCount >= mission.limit_count)
      return err("이미 완료한 미션이에요", 422);

    const slot = resolveNextSlot(logs, mission.limit_count);
    const { error } = await supabase.from("mission_logs").insert({
      mission_id: missionId,
      user_id: userId,
      slot,
      photo_url: photoUrl,
      verified_by: null,
      verified_at: null,
    });
    if (error) return err("업로드에 실패했어요", 500);
    return ok({ slot, photoUrl });
  },
);
