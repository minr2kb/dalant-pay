"use client";

import { useIsRestoring, useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/components/AuthGate";
import { MissionList } from "@/components/MissionList";
import { missionsQuery } from "@/lib/query/queries";
import { MissionsSkeleton } from "./MissionsSkeleton";

export function MissionListClient({ marketId }: { marketId: string }) {
  const userId = useSessionUserId();
  const isRestoring = useIsRestoring();

  const { data: missions } = useQuery({
    ...missionsQuery.list({ marketId, userId: userId ?? undefined }),
    enabled: !!userId,
  });

  if (isRestoring || !missions) return <MissionsSkeleton />;

  return (
    <div className="px-4 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">미션</h1>
      <MissionList
        missions={missions.filter((m) => m.isActive)}
        marketId={marketId}
      />
    </div>
  );
}
