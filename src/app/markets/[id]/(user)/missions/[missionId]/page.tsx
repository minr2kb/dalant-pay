import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MissionDetailClient } from "./MissionDetailClient";

function MissionDetailSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="px-4 max-w-lg mx-auto space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-full" />
          <Skeleton className="h-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

import { getCurrentUserId } from "@/lib/auth/current-user";

export default async function MissionDetailPage(
  props: PageProps<"/markets/[id]/missions/[missionId]">,
) {
  const { id: marketId, missionId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return (
    <Suspense fallback={<MissionDetailSkeleton />}>
      <MissionDetailClient
        marketId={marketId}
        missionId={missionId}
        userId={userId}
      />
    </Suspense>
  );
}
