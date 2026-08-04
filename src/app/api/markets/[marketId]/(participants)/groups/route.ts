import { createParser } from "@routar/core";
import {
  err,
  marketParticipantRoute,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { groupsRouter } from "@/lib/api/router";
import { listGroups } from "@/lib/data/groups";
import { mapGroup } from "@/lib/data/mappers";
import { STAFF_ROLES } from "@/types";

const createGroupParser = createParser(groupsRouter.endpoints.create);

export const GET = marketParticipantRoute<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listGroups(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);

export const POST = marketRoleRoute<{ marketId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(createGroupParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const { data, error } = await supabase
      .from("groups")
      .insert({ market_id: params.marketId, name: body.name })
      .select()
      .single();
    if (error || !data) return err(error?.message ?? "Error");
    return ok(mapGroup(data), 201);
  },
);
