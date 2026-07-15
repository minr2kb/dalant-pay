"use client";

import { useQueries } from "@tanstack/react-query";
import { orderBy } from "es-toolkit";
import { useMemo } from "react";
import { useSessionUserId } from "@/components/AuthGate";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { cn } from "@/lib/utils";
import { RankingSkeleton } from "./RankingSkeleton";

export function RankingClient({ marketId }: { marketId: string }) {
  const userId = useSessionUserId();

  const [{ data: market }, { data: participants }] = useQueries({
    queries: [
      { ...marketsQuery.get({ marketId }), enabled: !!userId },
      { ...participantsQuery.list({ marketId }), enabled: !!userId },
    ],
  });

  const ranked = useMemo(
    () => orderBy(participants ?? [], [(p) => p.balance], ["desc"]),
    [participants],
  );

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다 (home/missions와 동일).
  if (!market || !participants) return <RankingSkeleton />;
  const maxBalance = ranked[0]?.balance ?? 0;
  const pct = (balance: number) =>
    maxBalance > 0 ? Math.round((balance / maxBalance) * 100) : 0;

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // Podium order: 2nd(left), 1st(center), 3rd(right)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumConfig = [
    {
      medal: "🥈",
      blockH: "h-16",
      blockBg: "bg-emerald-200 dark:bg-emerald-800",
      labelColor: "text-gray-700 dark:text-gray-300",
    },
    {
      medal: "🥇",
      blockH: "h-24",
      blockBg: "bg-emerald-400 dark:bg-emerald-600",
      labelColor: "text-gray-900 dark:text-white",
    },
    {
      medal: "🥉",
      blockH: "h-10",
      blockBg: "bg-slate-300 dark:bg-slate-600",
      labelColor: "text-gray-500 dark:text-gray-400",
    },
  ];

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">랭킹</h1>

      {/* Podium */}
      {ranked.length > 0 && (
        <div className="flex items-end justify-center gap-3 pb-1">
          {podiumOrder.map((p, i) => {
            // biome-ignore lint/suspicious/noArrayIndexKey: podiumOrder is a fixed-length (3) array with a static position order (2nd/1st/3rd) that never reorders/inserts/deletes at runtime
            if (!p) return <div key={i} className="flex-1" />;
            const cfg = podiumConfig[i];
            const isMe = p.user.id === userId;
            return (
              <div
                key={p.id}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <p
                  className={cn(
                    "w-full truncate text-center text-sm font-bold",
                    cfg.labelColor,
                  )}
                >
                  {p.displayName}
                  {isMe && (
                    <span className="ml-1 text-[10px] font-normal text-emerald-500">
                      나
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                  {p.balance} {market.pointLabel}
                </p>
                <div
                  className={cn(
                    "podium-block w-full rounded-t-2xl flex items-center justify-center",
                    cfg.blockH,
                    cfg.blockBg,
                  )}
                  style={{ transitionDelay: `${[150, 0, 300][i]}ms` }}
                >
                  <span className="text-2xl">{cfg.medal}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4위 이하 */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((p, i) => {
            const rank = i + 4;
            const isMe = p.user.id === userId;
            const barPct = pct(p.balance);
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both",
                  isMe
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900",
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="w-5 shrink-0 text-center text-sm font-bold text-gray-400 dark:text-gray-500">
                  {rank}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold",
                      isMe
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-gray-900 dark:text-white",
                    )}
                  >
                    {p.displayName}
                    {isMe && (
                      <span className="ml-1 text-xs font-normal text-emerald-500">
                        (나)
                      </span>
                    )}
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={cn(
                        "ranking-bar h-full rounded-full",
                        isMe ? "bg-emerald-400" : "bg-emerald-300",
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    isMe
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  {p.balance} {market.pointLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {ranked.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-400">
          아직 참가자가 없어요
        </p>
      )}
    </div>
  );
}
