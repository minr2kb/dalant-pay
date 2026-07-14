import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import { listMissions } from "@/lib/data/missions";
import { getQueryClient } from "@/lib/query/get-query-client";
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
    try {
      const missions = await listMissions(supabase, marketId, { userId });
      qc.setQueryData(
        missionsQuery.list({ marketId, userId }).queryKey,
        missions,
      );
    } catch {
      // 조회 실패 시 클라이언트가 기존처럼 직접 받아온다.
    }
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <MissionListClient marketId={marketId} initialUserId={userId} />
    </HydrationBoundary>
  );
}
