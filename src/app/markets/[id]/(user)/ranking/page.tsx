import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { listParticipants } from "@/lib/data/participants";
import { listRecentMissionLogs } from "@/lib/data/point-logs";
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
  const qc = await prefetchIfFirstVisit(async (qc) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const supabase = await createClient();
    const [market, participants, recentMissions] = await Promise.all([
      getMarket(supabase, marketId),
      listParticipants(supabase, marketId),
      listRecentMissionLogs(supabase, marketId),
    ]);
    qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
    qc.setQueryData(
      participantsQuery.list({ marketId }).queryKey,
      participants,
    );
    qc.setQueryData(
      pointLogsQuery.recentMissions({ marketId }).queryKey,
      recentMissions,
    );
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <RankingClient marketId={marketId} />
    </HydrationBoundary>
  );
}
