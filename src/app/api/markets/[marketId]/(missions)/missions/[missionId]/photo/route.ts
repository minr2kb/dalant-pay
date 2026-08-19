import { createParser } from "@routar/core";
import {
  authRoute,
  err,
  isStaffRole,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { resolveNextSlot } from "@/lib/mission-slots";
import { sendPushToUsers } from "@/lib/push/send";

const uploadPhotoParser = createParser(missionsRouter.endpoints.uploadPhoto);
const deletePhotoParser = createParser(missionsRouter.endpoints.deletePhoto);

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId }) => {
    const parsed = await parseRequest(uploadPhotoParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { missionId } = params;
    const photoUrl = parsed.body.photoUrl ?? null;

    const { data: mission } = await supabase
      .from("missions")
      .select("title, limit_count, is_active, active_from, active_until")
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
      .select("slot, verified_at, voided_at")
      .eq("mission_id", missionId)
      .eq("user_id", userId);

    // 철회된 인증은 슬롯/횟수 집계에서 제외 - 아래 upsert가 voided 슬롯을 재사용한다
    const logs = (existingLogs ?? [])
      .filter((l) => l.voided_at === null)
      .map((l) => ({
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
    // upsert - voided 슬롯은 물리적으로 이미 존재하는 row라 plain insert면 unique 제약 충돌
    const { error } = await supabase.from("mission_logs").upsert(
      {
        mission_id: missionId,
        user_id: userId,
        slot,
        photo_url: photoUrl,
        verified_by: null,
        verified_by_name: null,
        verified_at: null,
        voided_at: null,
      },
      { onConflict: "mission_id,user_id,slot" },
    );
    if (error) return err("업로드에 실패했어요", 500);

    return ok({ slot, photoUrl });
  },
);

// 아직 승인되지 않은(verified_at null) 업로드만 삭제 대상 - 리워드가 나간 적
// 없으니 point_logs revoke처럼 voided_at으로 남길 필요 없이 그냥 지운다.
// 본인은 항상 자기 사진을 지울 수 있고, 다른 유저 걸 지우려면(관리자 반려) staff 권한 필요.
export const DELETE = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId: callerId }) => {
    // body가 아예 안 왔을 수 있다(본인 취소 호출) - req.json()은 빈 본문에 에러를 던진다
    const rawBody = await req.text();
    const parsed = await parseRequest(deletePhotoParser.parseRequest, {
      path: params,
      body: rawBody ? JSON.parse(rawBody) : undefined,
    });
    if (parsed instanceof Response) return parsed;
    const { marketId, missionId } = params;
    const targetUserId = parsed.body?.userId ?? callerId;

    if (targetUserId !== callerId) {
      const { data: caller } = await supabase
        .from("market_participants")
        .select("role")
        .eq("market_id", marketId)
        .eq("user_id", callerId)
        .maybeSingle();
      if (!isStaffRole(caller?.role)) return err("권한이 없어요", 403);
    }

    const { data, error } = await supabase
      .from("mission_logs")
      .delete()
      .eq("mission_id", missionId)
      .eq("user_id", targetUserId)
      .is("verified_at", null)
      .select("id");
    if (error) return err("삭제에 실패했어요", 500);
    if (!data || data.length === 0) return err("삭제할 사진이 없어요", 404);

    // ponytail: 알림은 부가 기능 - 실패해도 반려 자체는 이미 성공했으니 무시
    if (targetUserId !== callerId) {
      try {
        const { data: mission } = await supabase
          .from("missions")
          .select("title")
          .eq("id", missionId)
          .maybeSingle();
        await sendPushToUsers([targetUserId], {
          title: "인증이 반려됐어요",
          body: `${mission?.title ?? "미션"}이 반려됐어요. 다시 업로드해주세요`,
          url: `/markets/${marketId}/missions/${missionId}`,
        });
      } catch {}
    }

    return ok({ deleted: true });
  },
);
