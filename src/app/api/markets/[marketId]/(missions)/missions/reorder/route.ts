import { createParser } from "@routar/core";
import {
  err,
  marketRoleRoute,
  ok,
  parseRequest,
} from "@/lib/api/route-helpers";
import { missionsRouter } from "@/lib/api/router";
import { listMissions } from "@/lib/data/missions";
import { STAFF_ROLES } from "@/types";

const reorderParser = createParser(missionsRouter.endpoints.reorder);

export const PATCH = marketRoleRoute<{ marketId: string }>(
  STAFF_ROLES,
  async (req, { supabase, params }) => {
    const parsed = await parseRequest(reorderParser.parseRequest, {
      path: params,
      body: await req.json(),
    });
    if (parsed instanceof Response) return parsed;
    const { body } = parsed;

    const results = await Promise.all(
      body.missionIds.map((missionId, index) =>
        supabase
          .from("missions")
          .update({ sort_order: index })
          .eq("id", missionId)
          .eq("market_id", params.marketId),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);

    return ok(await listMissions(supabase, params.marketId));
  },
);
