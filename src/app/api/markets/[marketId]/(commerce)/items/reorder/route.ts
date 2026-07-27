import { createParser } from "@routar/core";
import {
  err,
  marketAdminRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { itemsRouter } from "@/lib/api/router";
import { listItems } from "@/lib/data/items";

const reorderParser = createParser(itemsRouter.endpoints.reorder);

export const PATCH = marketAdminRoute<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(reorderParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const results = await Promise.all(
      body.itemIds.map((itemId, index) =>
        supabase
          .from("market_items")
          .update({ sort_order: index })
          .eq("id", itemId)
          .eq("market_id", params.marketId),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);

    return ok(await listItems(supabase, params.marketId));
  },
);
