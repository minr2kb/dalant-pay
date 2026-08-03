"use client";

import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import Link from "next/link";
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
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          미션
        </h1>
        <Link
          href={`/markets/${marketId}/rewards`}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Gift className="h-3.5 w-3.5" />
          보상목록
        </Link>
      </div>
      <MissionList
        missions={missions.filter((m) => m.isActive)}
        marketId={marketId}
      />
    </div>
  );
}
