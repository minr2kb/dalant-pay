import { createParser } from "@routar/core";
import {
  err,
  marketAdminRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { participantsRouter } from "@/lib/api/router";

const adjustPointsParser = createParser(
  participantsRouter.endpoints.adjustPoints,
);

export const PATCH = marketAdminRoute<{ marketId: string; userId: string }>(
  async (req, { supabase, params }) => {
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

    return ok({
      userId,
      amount: body.amount,
      newBalance,
      memo: body.memo ?? null,
    });
  },
);
