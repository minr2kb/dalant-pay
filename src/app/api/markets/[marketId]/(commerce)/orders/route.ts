import { createParser } from "@routar/core";
import {
  err,
  marketAdminRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { ordersRouter } from "@/lib/api/router";
import { mapOrder } from "@/lib/db";

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

export const POST = marketAdminRoute<{ marketId: string }>(
  async (req, { supabase, params, userId: verifiedBy }) => {
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

    if (e1 || !participant) return err("User not found", 404);

    const priceMap = new Map(
      (marketItems ?? []).map((i) => [i.name as string, i.price as number]),
    );
    for (const item of body.items) {
      const serverPrice = priceMap.get(item.name);
      if (serverPrice === undefined || serverPrice !== item.price)
        return err("Invalid item", 400);
    }

    const total = body.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (participant.balance < total) return err("Insufficient balance", 422);

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
