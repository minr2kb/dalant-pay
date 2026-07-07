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
    <MissionList
      missions={missions.filter((m) => m.isActive)}
      marketId={marketId}
    />
  );
}
