import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { groupsRouter } from "@/lib/api/router";
import { mapGroup } from "@/lib/data/mappers";
import { STAFF_ROLES } from "@/types";

const updateGroupParser = createParser(groupsRouter.endpoints.update);

export const PATCH = marketRoleRoute<{ marketId: string; groupId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(updateGroupParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { data, error } = await supabase
      .from("groups")
      .update({ name: body.name })
      .eq("id", params.groupId)
      .eq("market_id", params.marketId)
      .select()
      .single();
    if (error || !data) return err(error?.message ?? "Not found", 404);
    return ok(mapGroup(data));
  },
);

export const DELETE = marketRoleRoute<{ marketId: string; groupId: string }>(
  STAFF_ROLES,
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", params.groupId)
      .eq("market_id", params.marketId);
    if (error) return err(error.message);
    return ok({ id: params.groupId });
  },
);
