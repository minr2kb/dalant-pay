import { createParser } from "@routar/core";
import {
  assertMarketActive,
  err,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { participantsRouter } from "@/lib/api/router";
import { sendPushToUsers } from "@/lib/push/send";
import { STAFF_ROLES } from "@/types";

const adjustPointsParser = createParser(
  participantsRouter.endpoints.adjustPoints,
);

export const PATCH = marketRoleRoute<{ marketId: string; userId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const gate = await assertMarketActive(params.marketId);
    if (gate) return gate;

    const parsed = await parseRequest(adjustPointsParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { marketId, userId } = params;

    const { data, error } = await supabase.rpc("grant_manual_points", {
      p_market_id: marketId,
      p_user_id: userId,
      p_amount: body.amount,
      p_memo: body.memo ?? null,
    });

    if (error) {
      if (error.message.includes("participant not found"))
        return err("참여자를 찾을 수 없어요", 404);
      if (error.message.includes("insufficient_balance"))
        return err("잔액이 부족해서 차감할 수 없어요", 422);
      return err(error.message);
    }

    const newBalance = (data as { newBalance: number }).newBalance;

    // ponytail: 알림은 부가 기능 — 실패해도 지급/차감 자체는 이미 성공했으니 무시
    try {
      const { data: marketRow } = await supabase
        .from("markets")
        .select("point_label")
        .eq("id", marketId)
        .maybeSingle();
      const label = marketRow?.point_label ?? "포인트";
      const isGain = body.amount > 0;
      await sendPushToUsers([userId], {
        title: isGain ? `${label}를 받았어요` : `${label}가 차감됐어요`,
        body: isGain
          ? `관리자가 ${body.amount}${label}을 지급했어요`
          : `관리자가 ${Math.abs(body.amount)}${label}을 차감했어요`,
        url: `/markets/${marketId}/home`,
      });
    } catch {}

    return ok({
      userId,
      amount: body.amount,
      newBalance,
      memo: body.memo ?? null,
    });
  },
);
