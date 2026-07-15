import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { resolveNextSlot } from "@/lib/mission-slots";
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

    if (!verifierParticipant) return err("이 마켓의 참여자가 아니에요", 403);

    if (
      (mission.type === "admin_qr" || mission.type === "upload") &&
      verifierRole !== "admin"
    )
      return err("관리자만 인증할 수 있는 미션이에요", 403);

    let targetUserId: string;
    if (body.token) {
      const parsed = verifyMissionQR(body.token);
      if (!parsed) return err("QR이 만료됐거나 올바르지 않아요", 400);
      if (parsed.marketId !== marketId || parsed.missionId !== missionId)
        return err("미션 정보가 일치하지 않아요", 400);
      targetUserId = parsed.userId;
    } else {
      if (verifierRole !== "admin") return err("권한이 없어요", 403);
      // biome-ignore lint/style/noNonNullAssertion: schema types userId as optional, but the !body.token && !body.userId guard above already ensures it's present here since body.token is falsy in this branch
      targetUserId = body.userId!;
    }

    if (targetUserId === verifiedBy && verifierRole !== "admin")
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
      .select("slot, verified_at")
      .eq("mission_id", missionId)
      .eq("user_id", targetUserId);

    const logs = (existingLogs ?? []).map((l) => ({
      slot: l.slot as number,
      verifiedAt: l.verified_at as string | null,
    }));
    const verifiedCount = logs.filter((l) => l.verifiedAt !== null).length;
    if (mission.limit_count !== null && verifiedCount >= mission.limit_count)
      return err("이미 완료한 미션이에요", 422);

    // 업로드형 미션은 인증 전 업로드 시점에 만든 미인증 로그(slot)를 그대로 확정한다
    const pendingLog = logs.find((l) => l.verifiedAt === null);
    const slotNum =
      body.slot ??
      pendingLog?.slot ??
      resolveNextSlot(logs, mission.limit_count);

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
      p_allow_self: verifierRole === "admin",
    });

    if (e3) {
      if (e3.message.includes("self verification not allowed"))
        return err("본인의 QR은 인증할 수 없어요", 403);
      if (
        e3.message.includes("already exists") ||
        e3.message.includes("unique")
      )
        return err("이미 인증된 미션이에요", 409);
      return err("적립에 실패했어요", 500);
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
