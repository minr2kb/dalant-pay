"use client";

import { orderBy } from "es-toolkit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelative } from "@/lib/format-date";
import { cn, firstChar } from "@/lib/utils";
import {
  SAMPLE_MARKET,
  SAMPLE_RANKING,
  SAMPLE_RECENT_MISSION_LOGS,
  SAMPLE_USER_NAME,
} from "../data";

const PODIUM_CONFIG = [
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

export default function SampleRankingPage() {
  const ranked = orderBy(SAMPLE_RANKING, [(e) => e.balance], ["desc"]);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {SAMPLE_MARKET.pointLabel} 랭킹
      </h1>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          최근 미션 인증
        </h2>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {SAMPLE_RECENT_MISSION_LOGS.map((log) => (
            <div
              key={log.id}
              className="flex w-40 shrink-0 items-center gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-200">
                  {log.participantName}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {log.missionTitle}
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
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-center gap-3 pb-1">
        {podiumOrder.map((p, i) => {
          if (!p) return null;
          const cfg = PODIUM_CONFIG[i];
          const isMe = p.displayName === SAMPLE_USER_NAME;
          return (
            <div
              key={p.displayName}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <Avatar size="sm">
                <AvatarFallback>{firstChar(p.displayName)}</AvatarFallback>
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
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                {p.balance} {SAMPLE_MARKET.pointLabel}
              </p>
              <div
                className={cn(
                  "w-full rounded-t-2xl flex items-center justify-center",
                  cfg.blockH,
                  cfg.blockBg,
                )}
              >
                <span className="text-2xl">{cfg.medal}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {rest.map((p, i) => {
          const isMe = p.displayName === SAMPLE_USER_NAME;
          return (
            <div
              key={p.displayName}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                isMe
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900",
              )}
            >
              <span className="w-5 shrink-0 text-center text-sm font-bold text-gray-400 dark:text-gray-500">
                {i + 4}
              </span>
              <Avatar size="sm">
                <AvatarFallback>{firstChar(p.displayName)}</AvatarFallback>
              </Avatar>
              <p
                className={cn(
                  "flex-1 truncate text-sm font-semibold",
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
              <span
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  isMe
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-700 dark:text-gray-300",
                )}
              >
                {p.balance} {SAMPLE_MARKET.pointLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
