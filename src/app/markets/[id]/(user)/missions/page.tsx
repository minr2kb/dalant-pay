import { getCurrentUserId } from "@/lib/auth/current-user";
import { listMissions } from "@/lib/data/missions";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { prefetchQuietly } from "@/lib/query/prefetch";
import { missionsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MissionListClient } from "./MissionListClient";

export default async function MissionsPage(
  props: PageProps<"/markets/[id]/missions">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  const qc = getQueryClient();

  if (userId) {
    const supabase = await createClient();
    await prefetchQuietly(async () => {
      await hydrate(qc, {
        queryKey: missionsQuery.list({ marketId, userId }).queryKey,
        queryFn: () => listMissions(supabase, marketId, { userId }),
      });
    });
  }

  return (
    <Hydrated qc={qc}>
      <MissionListClient marketId={marketId} initialUserId={userId} />
    </Hydrated>
  );
}
