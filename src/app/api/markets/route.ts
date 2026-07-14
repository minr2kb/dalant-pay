import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { listMarkets } from "@/lib/data/markets";

export const dynamic = "force-dynamic";

export const GET = authRoute(async (_req, { supabase, userId }) => {
  try {
    return ok(await listMarkets(supabase, userId));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Error");
  }
});
