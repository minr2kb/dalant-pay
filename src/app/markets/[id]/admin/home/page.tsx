import { getMarket } from "@/lib/data/markets";
import { listMissions, listPendingMissionLogs } from "@/lib/data/missions";
import { listParticipants } from "@/lib/data/participants";
import { listPointLogs } from "@/lib/data/point-logs";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrateAll } from "@/lib/query/hydrate";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminHomeClient } from "./AdminHomeClient";

export default async function AdminHomePage(
  props: PageProps<"/markets/[id]/admin/home">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const qc = await hydrateAll(getQueryClient(), [
    {
      queryKey: marketsQuery.get({ marketId }).queryKey,
      queryFn: () => getMarket(supabase, marketId),
    },
    {
      queryKey: participantsQuery.list({ marketId }).queryKey,
      queryFn: () => listParticipants(supabase, marketId),
    },
    {
      queryKey: missionsQuery.list({ marketId }).queryKey,
      queryFn: () => listMissions(supabase, marketId),
    },
    {
      queryKey: pointLogsQuery.list({ marketId }).queryKey,
      queryFn: () => listPointLogs(supabase, marketId),
    },
    {
      queryKey: missionsQuery.pendingLogs({ marketId }).queryKey,
      queryFn: () => listPendingMissionLogs(supabase, marketId),
    },
  ]);
  return (
    <Hydrated qc={qc}>
      <AdminHomeClient marketId={marketId} />
    </Hydrated>
  );
}
