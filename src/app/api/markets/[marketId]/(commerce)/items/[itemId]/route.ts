import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { itemsRouter } from "@/lib/api/router";
import { mapItem } from "@/lib/data/mappers";
import { STAFF_ROLES } from "@/types";

const updateItemParser = createParser(itemsRouter.endpoints.update);

export const PATCH = marketRoleRoute<{ marketId: string; itemId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(updateItemParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const update: Record<string, unknown> = {};
    if ("name" in body) update.name = body.name;
    if ("price" in body) update.price = body.price;
    if ("sortOrder" in body) update.sort_order = body.sortOrder;
    if ("isActive" in body) update.is_active = body.isActive;

    const { data, error } = await supabase
      .from("market_items")
      .update(update)
      .eq("id", params.itemId)
      .select()
      .single();
    if (error || !data) return err(error?.message ?? "Not found", 404);
    return ok(mapItem(data));
  },
);

export const DELETE = marketRoleRoute<{ marketId: string; itemId: string }>(
  STAFF_ROLES,
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("market_items")
      .delete()
      .eq("id", params.itemId);
    if (error) return err(error.message);
    return ok({ id: params.itemId });
  },
);
