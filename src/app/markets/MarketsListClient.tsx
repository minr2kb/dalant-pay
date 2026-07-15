"use client";

import { useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/components/AuthGate";
import { MarketCard } from "@/components/MarketCard";
import { marketsQuery } from "@/lib/query/queries";
import { MarketsSkeleton } from "./MarketsSkeleton";

export function MarketsListClient() {
  const userId = useSessionUserId();

  const { data: items } = useQuery({
    ...marketsQuery.list(),
    enabled: !!userId,
  });

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다 (home/missions와 동일).
  if (!items) return <MarketsSkeleton />;

  const joined = items.filter((i) => i.isJoined);
  const available = items.filter((i) => !i.isJoined);

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            마켓
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            참여 가능한 행사를 선택하세요
          </p>
        </div>

        {joined.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              참여 중인 마켓
            </h2>
            {joined.map(({ market, participantCount }) => (
              <MarketCard
                key={market.id}
                market={market}
                participantCount={participantCount}
                isJoined
              />
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            참여 가능한 마켓
          </h2>
          {available.length > 0 ? (
            available.map(({ market, participantCount }) => (
              <MarketCard
                key={market.id}
                market={market}
                participantCount={participantCount}
                isJoined={false}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                다른 활성 마켓이 없어요
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                QR 코드를 스캔해서 참여할 수 있어요
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
