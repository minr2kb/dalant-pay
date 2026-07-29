import { err, marketRoleRoute, ok } from "@/lib/api/route-helpers";
import { listPendingMissionLogs } from "@/lib/data/missions";
import { STAFF_ROLES } from "@/types";

export const GET = marketRoleRoute<{ marketId: string }>(
  STAFF_ROLES,
  async (_req, { supabase, params }) => {
    try {
      return ok(await listPendingMissionLogs(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
