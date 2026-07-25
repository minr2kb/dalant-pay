import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getMarket } from "@/lib/data/markets";
import { listMissions, listPendingMissionLogs } from "@/lib/data/missions";
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
import { AdminHomeClient } from "./AdminHomeClient";
import Loading from "./loading";

export default async function AdminHomePage(
  props: PageProps<"/markets/[id]/admin/home">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const qc = getQueryClient();
  const [market, participants, missions, pointLogs, pendingLogs] =
    await Promise.all([
      getMarket(supabase, marketId),
      listParticipants(supabase, marketId),
      listMissions(supabase, marketId),
      listPointLogs(supabase, marketId),
      listPendingMissionLogs(supabase, marketId),
    ]);
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, participants);
  qc.setQueryData(missionsQuery.list({ marketId }).queryKey, missions);
  qc.setQueryData(pointLogsQuery.list({ marketId }).queryKey, pointLogs);
  qc.setQueryData(
    missionsQuery.pendingLogs({ marketId }).queryKey,
    pendingLogs,
  );
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Loading />}>
        <AdminHomeClient marketId={marketId} />
      </Suspense>
    </HydrationBoundary>
  );
}
