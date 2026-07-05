import { err, marketAdminRoute, ok } from "@/lib/api/route-helpers";
import { listPendingMissionLogs } from "@/lib/data/missions";

export const GET = marketAdminRoute<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listPendingMissionLogs(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
