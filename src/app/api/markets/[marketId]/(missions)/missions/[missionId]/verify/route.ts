import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { verifyMissionQR } from "@/lib/qr-server";

const verifyMissionParser = createParser(missionsRouter.endpoints.verify);

export const POST = authRoute<{ marketId: string; missionId: string }>(
  async (req, { supabase, params, userId: verifiedBy }) => {
    const parsed = await parseRequest(verifyMissionParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;
    const { marketId, missionId } = params;

    if (!body.token && !body.userId) return err("QR 인증이 필요해요", 400);

    const [
      { data: mission, error: e1 },
      { data: verifier },
      { data: verifierParticipant },
    ] = await Promise.all([
      supabase.from("missions").select("*").eq("id", missionId).single(),
      supabase
        .from("users")
        .select("real_name")
        .eq("id", verifiedBy)
        .maybeSingle(),
      supabase
        .from("market_participants")
        .select("role")
        .eq("market_id", marketId)
        .eq("user_id", verifiedBy)
        .maybeSingle(),
    ]);

    if (e1 || !mission) return err("미션을 찾을 수 없어요", 404);

    const verifierRole = (verifierParticipant as { role?: string } | null)
      ?.role;

    if (
      (mission.type === "admin_qr" || mission.type === "upload") &&
      verifierRole !== "admin"
    )
      return err("관리자만 인증할 수 있는 미션이에요", 403);
    if (mission.type === "user_qr" && verifierRole === "admin")
      return err("유저 간 인증 미션이에요. 다른 참여자가 스캔해야 해요", 403);

    let targetUserId: string;
    if (body.token) {
      const parsed = verifyMissionQR(body.token);
      if (!parsed) return err("QR이 만료됐거나 올바르지 않아요", 400);
      if (parsed.marketId !== marketId || parsed.missionId !== missionId)
        return err("미션 정보가 일치하지 않아요", 400);
      targetUserId = parsed.userId;
    } else {
      if (verifierRole !== "admin") return err("권한이 없어요", 403);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      targetUserId = body.userId!;
    }

    if (targetUserId === verifiedBy)
      return err("본인의 QR은 인증할 수 없어요", 403);

    const { data: participant, error: e2 } = await supabase
      .from("market_participants")
      .select("balance")
      .eq("market_id", marketId)
      .eq("user_id", targetUserId)
      .single();

    if (e2 || !participant) return err("참여자를 찾을 수 없어요", 404);

    const { data: existingLogs } = await supabase
      .from("mission_logs")
      .select("slot")
      .eq("mission_id", missionId)
      .eq("user_id", targetUserId);

    const usedSlots = new Set(
      (existingLogs ?? []).map((l) => l.slot as number),
    );
    if (mission.limit_count !== null && usedSlots.size >= mission.limit_count)
      return err("이미 완료한 미션이에요", 422);

    const slotNum =
      body.slot ??
      (() => {
        if (mission.limit_count === null) {
          const maxUsed = usedSlots.size > 0 ? Math.max(...usedSlots) : 0;
          return maxUsed + 1;
        }
        return (
          Array.from({ length: mission.limit_count }, (_, i) => i + 1).find(
            (s) => !usedSlots.has(s),
          ) ?? 1
        );
      })();

    const verifiedAt = new Date().toISOString();
    const verifierName =
      (verifier as { real_name?: string } | null)?.real_name ?? verifiedBy;

    const { error: e3 } = await supabase.rpc("award_mission", {
      p_market_id: marketId,
      p_mission_id: missionId,
      p_user_id: targetUserId,
      p_verified_by: verifiedBy,
      p_slot: slotNum,
      p_verified_by_name: verifierName,
      p_verified_at: verifiedAt,
      p_reward: mission.reward,
      p_mission_title: mission.title,
    });

    if (e3) {
      if (e3.message.includes("mission_logs_check"))
        return err("본인의 QR은 인증할 수 없어요", 403);
      if (
        e3.message.includes("already exists") ||
        e3.message.includes("unique")
      )
        return err("이미 인증된 미션이에요", 409);
      return err("적립에 실패했어요", 500);
    }

    if (body.photoUrls && body.photoUrls.length > 0) {
      await supabase
        .from("mission_logs")
        .update({ photo_url: body.photoUrls.join(",") })
        .eq("mission_id", missionId)
        .eq("user_id", targetUserId)
        .eq("slot", slotNum);
    }

    return ok({
      missionId,
      userId: targetUserId,
      verifiedBy,
      slot: slotNum,
      reward: mission.reward,
      verifiedAt,
    });
  },
);
