"use client";

import { useQueries } from "@tanstack/react-query";
import { keyBy, orderBy } from "es-toolkit";
import { useMemo, useRef } from "react";
import { useSessionUserId } from "@/components/AuthGate";
import { openPointLogDetail } from "@/components/PointLogDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { formatRelative } from "@/lib/format-date";
import {
  marketsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { cn } from "@/lib/utils";
import { RankingSkeleton } from "./RankingSkeleton";

export function RankingClient({ marketId }: { marketId: string }) {
  const userId = useSessionUserId();

  const [{ data: market }, { data: participants }, { data: recentMissions }] =
    useQueries({
      queries: [
        { ...marketsQuery.get({ marketId }), enabled: !!userId },
        { ...participantsQuery.list({ marketId }), enabled: !!userId },
        { ...pointLogsQuery.recentMissions({ marketId }), enabled: !!userId },
      ],
    });

  const ranked = useMemo(
    () => orderBy(participants ?? [], [(p) => p.balance], ["desc"]),
    [participants],
  );

  const participantMap = useMemo(
    () => keyBy(participants ?? [], (p) => p.user.id),
    [participants],
  );

  // 카드가 적으면(3개 미만) 무한 루프 특유의 "복제된 카드가 또 나온다" 느낌만 주고
  // 자동 스크롤할 만큼 콘텐츠가 없으니, 그럴 땐 그냥 정적으로 둔다.
  const shouldAutoScroll = !!recentMissions && recentMissions.length >= 3;
  const recentMissionsScrollRef = useRef<HTMLDivElement>(null);
  useAutoScroll(recentMissionsScrollRef, { enabled: shouldAutoScroll });

  // 동점자는 같은 순위를 받고 다음 순위는 그만큼 건너뛴다 (표준 경쟁 순위, 1-2-2-4)
  const ranks = useMemo(() => {
    const map = new Map<string, number>();
    ranked.forEach((p, i) => {
      const rank =
        i > 0 && p.balance === ranked[i - 1].balance
          ? (map.get(ranked[i - 1].id) as number)
          : i + 1;
      map.set(p.id, rank);
    });
    return map;
  }, [ranked]);

  const tiedRanks = useMemo(() => {
    const counts = new Map<number, number>();
    ranks.forEach((r) => {
      counts.set(r, (counts.get(r) ?? 0) + 1);
    });
    return new Set([...counts].filter(([, c]) => c > 1).map(([r]) => r));
  }, [ranks]);

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다 (home/missions와 동일).
  if (!market || !participants) return <RankingSkeleton />;
  const maxBalance = ranked[0]?.balance ?? 0;
  const pct = (balance: number) =>
    maxBalance > 0 ? Math.round((balance / maxBalance) * 100) : 0;

  // 전원 0점이면 포듐(1/2/3등 시상대)이 의미가 없으니 순위 리스트로만 보여준다
  const top3 = maxBalance > 0 ? ranked.slice(0, 3) : [];
  const rest = maxBalance > 0 ? ranked.slice(3) : ranked;

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
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        랭킹
      </h1>

      {/* 최근 미션 인증 — 참가자가 많으면 아래 순위 리스트가 길어 스크롤에 묻히므로 최상단에 배치.
          가로 스크롤 칩으로: 세로 카드 스택은 랭킹 페이지를 과하게 길어 보이게 했다 */}
      {recentMissions === undefined ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            최근 미션 인증
          </h2>
          <div className="flex gap-2 overflow-hidden -mx-4 px-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] w-40 shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        </div>
      ) : (
        recentMissions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              최근 미션 인증
            </h2>
            <div
              ref={recentMissionsScrollRef}
              className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
              {(shouldAutoScroll
                ? [...recentMissions, ...recentMissions]
                : recentMissions
              ).map((log, i) => {
                const thumbUrl = log.photoUrl?.split(",")[0];
                const participantName =
                  participantMap[log.userId]?.user.realName ?? "알 수 없음";
                return (
                  <button
                    key={`${log.id}-${i}`}
                    type="button"
                    onClick={() =>
                      openPointLogDetail({
                        log,
                        participantName,
                        pointLabel: market.pointLabel,
                      })
                    }
                    className="flex w-40 shrink-0 items-center gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-3 text-left active:scale-95 transition-transform"
                  >
                    {thumbUrl && (
                      // biome-ignore lint/performance/noImgElement: small thumbnail only
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-200">
                        {participantName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {log.missionTitle ?? "미션"}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold tabular-nums text-emerald-500">
                          +{log.amount}
                        </p>
                        <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                          {formatRelative(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Podium */}
      {top3.length > 0 && (
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
                <Avatar size="sm">
                  <AvatarImage src={p.user.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{p.user.realName.slice(0, 1)}</AvatarFallback>
                </Avatar>
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
                  {tiedRanks.has(ranks.get(p.id) as number) && (
                    <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                      공동 {ranks.get(p.id)}위
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
            const rank = ranks.get(p.id) as number;
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
                <Avatar size="sm">
                  <AvatarImage src={p.user.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{p.user.realName.slice(0, 1)}</AvatarFallback>
                </Avatar>
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
