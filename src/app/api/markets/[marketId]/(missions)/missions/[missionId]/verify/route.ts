import { createParser } from "@routar/core";
import { NextResponse } from "next/server";
import { withIdempotencyKey } from "@/lib/api/idempotency";
import {
  assertMarketActive,
  authRoute,
  err,
  isStaffRole,
  parseRequest,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { resolveNextSlot } from "@/lib/mission-slots";
import { sendPushToUsers } from "@/lib/push/send";
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

    const gate = await assertMarketActive(marketId);
    if (gate) return gate;

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
    if (!mission.is_active) return err("비활성화된 미션이에요", 403);
    const now = new Date();
    if (mission.active_from && new Date(mission.active_from as string) > now)
      return err("아직 시작되지 않은 미션이에요", 403);
    if (mission.active_until && new Date(mission.active_until as string) < now)
      return err("종료된 미션이에요", 403);

    const verifierRole = (verifierParticipant as { role?: string } | null)
      ?.role;

    if (!verifierParticipant) return err("이 마켓의 참여자가 아니에요", 403);

    if (
      (mission.type === "admin_qr" || mission.type === "upload") &&
      !isStaffRole(verifierRole)
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
      if (!isStaffRole(verifierRole)) return err("권한이 없어요", 403);
      // biome-ignore lint/style/noNonNullAssertion: schema types userId as optional, but the !body.token && !body.userId guard above already ensures it's present here since body.token is falsy in this branch
      targetUserId = body.userId!;
    }

    if (targetUserId === verifiedBy && !isStaffRole(verifierRole))
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
      .select("slot, verified_at, voided_at")
      .eq("mission_id", missionId)
      .eq("user_id", targetUserId);

    // 철회된 인증은 슬롯/횟수 집계에서 제외 — award_mission이 voided 슬롯을 재사용한다
    const logs = (existingLogs ?? [])
      .filter((l) => l.voided_at === null)
      .map((l) => ({
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

    const rewardMin = mission.reward_min as number | null;
    const rewardMax = mission.reward_max as number | null;
    let reward = mission.reward as number;
    if (rewardMin !== null && rewardMax !== null) {
      if (body.reward === undefined)
        return err("지급할 달란트 금액을 입력해주세요", 400);
      if (body.reward < rewardMin || body.reward > rewardMax)
        return err(`보상은 ${rewardMin}~${rewardMax} 사이로 입력해주세요`, 400);
      reward = body.reward;
    }

    // idempotencyKey가 있으면 같은 키의 재시도는 award_mission을 다시 안 태우고
    // 첫 실행 결과를 그대로 재생한다 — 네트워크 문제로 응답을 못 받은 클라이언트가
    // 재시도할 때 "이미 인증된 미션이에요" 에러 대신 원래 성공 응답을 그대로 받는다.
    const { status, json } = await withIdempotencyKey(
      supabase,
      {
        key: req.headers.get("Idempotency-Key") ?? undefined,
        marketId,
        userId: verifiedBy,
        endpoint: "verify",
      },
      async () => {
        const { error: e3 } = await supabase.rpc("award_mission", {
          p_market_id: marketId,
          p_mission_id: missionId,
          p_user_id: targetUserId,
          p_verified_by: verifiedBy,
          p_slot: slotNum,
          p_verified_by_name: verifierName,
          p_verified_at: verifiedAt,
          p_reward: reward,
          p_mission_title: mission.title,
          p_allow_self: isStaffRole(verifierRole),
        });

        if (e3) {
          if (e3.message.includes("self verification not allowed"))
            return {
              status: 403,
              json: { error: "본인의 QR은 인증할 수 없어요" },
            };
          if (
            e3.message.includes("already exists") ||
            e3.message.includes("unique")
          )
            return { status: 409, json: { error: "이미 인증된 미션이에요" } };
          return { status: 500, json: { error: "적립에 실패했어요" } };
        }

        // ponytail: 알림은 부가 기능 — 실패해도 인증 자체는 이미 성공했으니 무시
        try {
          const { data: marketRow } = await supabase
            .from("markets")
            .select("point_label")
            .eq("id", marketId)
            .maybeSingle();
          await sendPushToUsers([targetUserId], {
            title: "미션 인증 완료",
            body: `${mission.title} +${reward}${marketRow?.point_label ?? "포인트"}`,
            url: `/markets/${marketId}/missions/${missionId}`,
          });
        } catch {}

        return {
          status: 200,
          json: {
            data: {
              missionId,
              userId: targetUserId,
              verifiedBy,
              slot: slotNum,
              reward,
              verifiedAt,
            },
          },
        };
      },
    );

    return NextResponse.json(json, { status });
  },
);
