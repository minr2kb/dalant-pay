import { getCurrentUserId } from "@/lib/auth/current-user";
import { getMarket } from "@/lib/data/markets";
import { listParticipants } from "@/lib/data/participants";
import { listEarnedTotals, listRecentMissionLogs } from "@/lib/data/point-logs";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrateAll } from "@/lib/query/hydrate";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import {
  marketsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { RankingClient } from "./RankingClient";

export default async function RankingPage(
  props: PageProps<"/markets/[id]/ranking">,
) {
  const { id: marketId } = await props.params;
  const qc = getQueryClient();
  await prefetchIfFirstVisit(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const supabase = await createClient();
    await hydrateAll(qc, [
      {
        queryKey: marketsQuery.get({ marketId }).queryKey,
        queryFn: () => getMarket(supabase, marketId),
      },
      {
        queryKey: participantsQuery.list({ marketId }).queryKey,
        queryFn: () => listParticipants(supabase, marketId),
      },
      {
        queryKey: pointLogsQuery.recentMissions({ marketId }).queryKey,
        queryFn: () => listRecentMissionLogs(supabase, marketId),
      },
      {
        queryKey: pointLogsQuery.earnedTotals({ marketId }).queryKey,
        queryFn: () => listEarnedTotals(supabase, marketId),
      },
    ]);
  });

  return (
    <Hydrated qc={qc}>
      <RankingClient marketId={marketId} />
    </Hydrated>
  );
}
