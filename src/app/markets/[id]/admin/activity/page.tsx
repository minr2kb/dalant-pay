import { getCurrentUserId } from "@/lib/auth/current-user";
import { getMarket } from "@/lib/data/markets";
import { listPendingMissionLogs } from "@/lib/data/missions";
import { listParticipants } from "@/lib/data/participants";
import { listPointLogs } from "@/lib/data/point-logs";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrateAll } from "@/lib/query/hydrate";
import {
  marketsQuery,
  missionsQuery,
  POINT_LOGS_PAGE_SIZE,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { ActivityListClient } from "./ActivityListClient";

export default async function AdminActivityPage(
  props: PageProps<"/markets/[id]/admin/activity">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const [currentUserId, qc] = await Promise.all([
    getCurrentUserId(),
    hydrateAll(getQueryClient(), [
      {
        queryKey: marketsQuery.get({ marketId }).queryKey,
        queryFn: () => getMarket(supabase, marketId),
      },
      {
        queryKey: participantsQuery.list({ marketId }).queryKey,
        queryFn: () => listParticipants(supabase, marketId),
      },
      {
        // useSuspenseInfiniteQuery가 기대하는 { pages, pageParams } 캐시 모양을
        // 직접 채운다 — 첫 페이지만 프리페치하고 나머지는 "더 보기"로 받는다.
        queryKey: pointLogsQuery.list.infinite.queryKey({
          marketId,
        }),
        queryFn: async () => ({
          pages: [
            await listPointLogs(supabase, marketId, {
              page: 0,
              pageSize: POINT_LOGS_PAGE_SIZE,
            }),
          ],
          pageParams: [0],
        }),
      },
      {
        queryKey: missionsQuery.pendingLogs({ marketId }).queryKey,
        queryFn: () => listPendingMissionLogs(supabase, marketId),
      },
    ]),
  ]);
  return (
    <Hydrated qc={qc}>
      <ActivityListClient marketId={marketId} currentUserId={currentUserId} />
    </Hydrated>
  );
}
