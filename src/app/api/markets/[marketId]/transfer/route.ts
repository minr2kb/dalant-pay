import { createParser } from "@routar/core";
import { NextResponse } from "next/server";
import { withIdempotencyKey } from "@/lib/api/idempotency";
import {
  assertMarketActive,
  authRoute,
  err,
  parseRequest,
} from "@/lib/api/route-helpers";
import { transferRouter } from "@/lib/api/router";
import { sendPushToUsers } from "@/lib/push/send";

const transferParser = createParser(transferRouter.endpoints.transfer);

export const POST = authRoute<{ marketId: string }>(
  async (req, { supabase, params, userId: fromUserId }) => {
    const parsed = await parseRequest(transferParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;
    const { marketId } = params;

    if (body.toUserId === fromUserId)
      return err("자신에게는 전송할 수 없습니다", 400);

    const gate = await assertMarketActive(marketId);
    if (gate) return gate;

    // 이름 조회 (memo 생성용)
    const [{ data: fromUser }, { data: toUser }] = await Promise.all([
      supabase.from("users").select("real_name").eq("id", fromUserId).single(),
      supabase
        .from("users")
        .select("real_name")
        .eq("id", body.toUserId)
        .single(),
    ]);

    if (!fromUser) return err("송신자를 찾을 수 없습니다", 404);
    if (!toUser) return err("수신자를 찾을 수 없습니다", 404);

    const memo = `${fromUser.real_name} -> ${toUser.real_name}`;

    // idempotencyKey가 있으면 같은 키의 재시도(네트워크 재시도, 더블탭)는 RPC를 다시
    // 안 태우고 첫 실행 결과를 그대로 재생한다 — 푸시 발송도 이 안에 있어서 재전송 안 됨.
    const { status, json } = await withIdempotencyKey(
      supabase,
      {
        key: req.headers.get("Idempotency-Key") ?? undefined,
        marketId,
        userId: fromUserId,
        endpoint: "transfer",
      },
      async () => {
        const { data, error } = await supabase.rpc("transfer_points", {
          p_market_id: marketId,
          p_from_user_id: fromUserId,
          p_to_user_id: body.toUserId,
          p_amount: body.amount,
          p_memo: memo,
        });

        if (error) {
          if (error.message.includes("insufficient_balance"))
            return { status: 400, json: { error: "잔액이 부족합니다" } };
          if (error.message.includes("sender_not_found"))
            return {
              status: 404,
              json: { error: "참가자를 찾을 수 없습니다" },
            };
          if (error.message.includes("recipient_not_found"))
            return {
              status: 404,
              json: { error: "수신자가 이 마켓의 참가자가 아닙니다" },
            };
          return { status: 500, json: { error: error.message } };
        }

        const newBalance = (data as { new_balance: number }).new_balance;

        // ponytail: 알림은 부가 기능 — 실패해도 전송 자체는 이미 성공했으니 무시
        try {
          const { data: marketRow } = await supabase
            .from("markets")
            .select("point_label")
            .eq("id", marketId)
            .maybeSingle();
          await sendPushToUsers([body.toUserId], {
            title: "달란트를 받았어요",
            body: `${fromUser.real_name}님이 ${body.amount}${marketRow?.point_label ?? "포인트"}을 보냈어요`,
            url: `/markets/${marketId}/home`,
          });
        } catch {}

        return {
          status: 200,
          json: {
            data: {
              fromUserId,
              toUserId: body.toUserId,
              amount: body.amount,
              newBalance,
            },
          },
        };
      },
    );

    return NextResponse.json(json, { status });
  },
);
