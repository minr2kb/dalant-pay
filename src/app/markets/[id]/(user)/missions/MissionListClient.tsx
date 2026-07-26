"use client";

import { useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/components/AuthGate";
import { MissionList } from "@/components/mission/MissionList";
import { missionsQuery } from "@/lib/query/queries";
import { MissionsSkeleton } from "./MissionsSkeleton";

export function MissionListClient({
  marketId,
  initialUserId,
}: {
  marketId: string;
  initialUserId: string | null;
}) {
  // useSessionUserId()가 비동기로 채워지기 전엔 서버가 이미 검증한 initialUserId로 쿼리 키를
  // 맞춰서 SSR prefetch 캐시를 첫 렌더부터 바로 쓴다 — UserHomeClient와 동일한 이유.
  const userId = useSessionUserId() ?? initialUserId;

  const { data: missions } = useQuery({
    ...missionsQuery.list({ marketId, userId: userId ?? undefined }),
    enabled: !!userId,
  });

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다.
  if (!missions) return <MissionsSkeleton />;

  return (
    <div className="px-4 pb-4 max-w-lg mx-auto space-y-5">
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        미션
      </h1>
      <MissionList
        missions={missions.filter((m) => m.isActive)}
        marketId={marketId}
      />
    </div>
  );
}
