import { createParser } from "@routar/core";
import {
  assertMarketActive,
  err,
  marketRoleRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { ordersRouter } from "@/lib/api/router";
import { mapOrder } from "@/lib/data/mappers";
import { sendPushToUsers } from "@/lib/push/send";
import { STAFF_ROLES } from "@/types";

const createOrderParser = createParser(ordersRouter.endpoints.create);

export const GET = route<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const userId = req.nextUrl.searchParams.get("userId");

    let query = supabase
      .from("orders")
      .select("*")
      .eq("market_id", params.marketId)
      .order("purchased_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) return err(error.message);
    return ok((data ?? []).map((r) => mapOrder(r as Record<string, unknown>)));
  },
);

export const POST = marketRoleRoute<{ marketId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params, userId: verifiedBy }) => {
    const gate = await assertMarketActive(params.marketId);
    if (gate) return gate;

    const parsed = await parseRequest(createOrderParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const [{ data: participant, error: e1 }, { data: marketItems }] =
      await Promise.all([
        supabase
          .from("market_participants")
          .select("balance")
          .eq("market_id", params.marketId)
          .eq("user_id", body.userId)
          .single(),
        supabase
          .from("market_items")
          .select("name, price")
          .eq("market_id", params.marketId),
      ]);

    if (e1 || !participant) return err("참여자를 찾을 수 없어요", 404);

    const priceMap = new Map(
      (marketItems ?? []).map((i) => [i.name as string, i.price as number]),
    );
    for (const item of body.items) {
      const serverPrice = priceMap.get(item.name);
      if (serverPrice === undefined || serverPrice !== item.price)
        return err("상품 정보가 변경됐어요. 다시 시도해주세요", 400);
    }

    const total = body.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (participant.balance < total) return err("잔액이 부족해요", 422);

    const { data: verifier } = await supabase
      .from("users")
      .select("real_name")
      .eq("id", verifiedBy)
      .maybeSingle();

    const verifierName =
      (verifier as { real_name?: string } | null)?.real_name ?? verifiedBy;
    const itemName =
      body.items.length === 1
        ? body.items[0].name
        : `${body.items[0].name} 외 ${body.items.length - 1}건`;

    const { data: result, error: e2 } = await supabase.rpc("process_order", {
      p_market_id: params.marketId,
      p_user_id: body.userId,
      p_verified_by: verifiedBy,
      p_verified_by_name: verifierName,
      p_items: body.items,
      p_total: total,
      p_item_name: itemName,
    });

    if (e2 || !result) return err(e2?.message ?? "Error");

    const r = result as { orderId: string; newBalance: number };

    // ponytail: 알림은 부가 기능 - 실패해도 구매 자체는 이미 성공했으니 무시
    try {
      const { data: marketRow } = await supabase
        .from("markets")
        .select("point_label")
        .eq("id", params.marketId)
        .maybeSingle();
      await sendPushToUsers([body.userId], {
        title: "구매 완료",
        body: `${itemName} -${total}${marketRow?.point_label ?? "포인트"}`,
        url: `/markets/${params.marketId}/history`,
      });
    } catch {}

    return ok(
      {
        id: r.orderId,
        marketId: params.marketId,
        userId: body.userId,
        verifiedBy,
        items: body.items,
        total,
        newBalance: r.newBalance,
        purchasedAt: new Date().toISOString(),
      },
      201,
    );
  },
);
