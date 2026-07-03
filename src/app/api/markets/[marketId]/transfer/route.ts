import { createParser } from "@routar/core";
import { authRoute, err, ok, parseRequest } from "@/lib/api/route-helpers";
import { transferRouter } from "@/lib/api/router";

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

    // 이름 조회 (memo 생성용)
    const [{ data: fromUser }, { data: toUser }, { data: market }] =
      await Promise.all([
        supabase
          .from("users")
          .select("real_name")
          .eq("id", fromUserId)
          .single(),
        supabase
          .from("users")
          .select("real_name")
          .eq("id", body.toUserId)
          .single(),
        supabase
          .from("markets")
          .select("starts_at, ends_at")
          .eq("id", marketId)
          .single(),
      ]);

    if (!fromUser) return err("송신자를 찾을 수 없습니다", 404);
    if (!toUser) return err("수신자를 찾을 수 없습니다", 404);

    const now = new Date();
    if (market?.starts_at && new Date(market.starts_at as string) > now)
      return err("마켓이 아직 시작되지 않았습니다", 403);
    if (market?.ends_at && new Date(market.ends_at as string) < now)
      return err("마켓이 종료되었습니다", 403);

    const memo = `${fromUser.real_name} -> ${toUser.real_name}`;

    const { data, error } = await supabase.rpc("transfer_points", {
      p_market_id: marketId,
      p_from_user_id: fromUserId,
      p_to_user_id: body.toUserId,
      p_amount: body.amount,
      p_memo: memo,
    });

    if (error) {
      if (error.message.includes("insufficient_balance"))
        return err("잔액이 부족합니다", 400);
      if (error.message.includes("sender_not_found"))
        return err("참가자를 찾을 수 없습니다", 404);
      if (error.message.includes("recipient_not_found"))
        return err("수신자가 이 마켓의 참가자가 아닙니다", 404);
      return err(error.message);
    }

    const newBalance = (data as { new_balance: number }).new_balance;

    return ok({
      fromUserId,
      toUserId: body.toUserId,
      amount: body.amount,
      newBalance,
    });
  },
);
