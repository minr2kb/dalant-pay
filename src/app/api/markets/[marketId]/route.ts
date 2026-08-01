import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
  route,
} from "@/lib/api/route-helpers";
import { marketsRouter } from "@/lib/api/router";
import { mapMarket } from "@/lib/data/mappers";
import { getMarket } from "@/lib/data/markets";

export const GET = route<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await getMarket(supabase, params.marketId));
    } catch {
      return err("Not found", 404);
    }
  },
);

const updateMarketParser = createParser(marketsRouter.endpoints.update);

export const PATCH = marketRoleRoute<{ marketId: string }>(
  ["owner"],
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(updateMarketParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.pointLabel !== undefined) patch.point_label = body.pointLabel;
    if (body.adminCode !== undefined) patch.admin_code = body.adminCode;
    if (body.startsAt !== undefined) patch.starts_at = body.startsAt;
    if (body.endsAt !== undefined) patch.ends_at = body.endsAt;

    const { data, error } = await supabase
      .from("markets")
      .update(patch)
      .eq("id", params.marketId)
      .select()
      .single();
    if (error || !data) return err(error?.message ?? "수정 실패");

    return ok(mapMarket(data as Record<string, unknown>));
  },
);

export const DELETE = marketRoleRoute<{ marketId: string }>(
  ["owner"],
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("markets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.marketId);
    if (error) return err(error.message);

    return ok({ deleted: true });
  },
);
