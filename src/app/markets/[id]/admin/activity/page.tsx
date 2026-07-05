import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { listPendingMissionLogs } from "@/lib/data/missions";
import { listParticipants } from "@/lib/data/participants";
import { listPointLogs } from "@/lib/data/point-logs";
import { getQueryClient } from "@/lib/query/get-query-client";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { ActivityListClient } from "./ActivityListClient";
import Loading from "./loading";

export default async function AdminActivityPage(
  props: PageProps<"/markets/[id]/admin/activity">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const [currentUserId, market, participants, pointLogs, pendingLogs] =
    await Promise.all([
      getCurrentUserId(),
      getMarket(supabase, marketId),
      listParticipants(supabase, marketId),
      listPointLogs(supabase, marketId),
      listPendingMissionLogs(supabase, marketId),
    ]);
  const qc = getQueryClient();
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, participants);
  qc.setQueryData(pointLogsQuery.list({ marketId }).queryKey, pointLogs);
  qc.setQueryData(
    missionsQuery.pendingLogs({ marketId }).queryKey,
    pendingLogs,
  );
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Loading />}>
        <ActivityListClient marketId={marketId} currentUserId={currentUserId} />
      </Suspense>
    </HydrationBoundary>
  );
}
