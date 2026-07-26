"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { keyBy, orderBy } from "es-toolkit";
import {
  ArrowRight,
  BellRing,
  Coins,
  CreditCard,
  ScanLine,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { openPointLogDetail } from "@/components/points/PointLogDetailModal";
import { PointLogItem } from "@/components/points/PointLogItem";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { getMissionStatus } from "@/types";

export function AdminHomeClient({ marketId }: { marketId: string }) {
  const [
    { data: market },
    { data: participants },
    { data: missions },
    { data: logs },
    { data: pendingLogs },
  ] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.list({ marketId }),
      missionsQuery.list({ marketId }),
      pointLogsQuery.list({ marketId }),
      missionsQuery.pendingLogs({ marketId }),
    ],
  });

  const activeMissions = useMemo(
    () => missions.filter((m) => getMissionStatus(m) === "active").length,
    [missions],
  );
  const totalGranted = useMemo(
    () => logs.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0),
    [logs],
  );
  const recentLogs = useMemo(
    () => orderBy(logs, [(l) => l.createdAt], ["desc"]).slice(0, 5),
    [logs],
  );
  const participantMap = useMemo(
    () => keyBy(participants, (p) => p.user.id),
    [participants],
  );

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {market.title}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              관리자화면
            </h1>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
        <Link
          href={`/markets/${marketId}/home`}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
        >
          <User className="h-3.5 w-3.5" />
          일반화면
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
            {participants.length}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            참여자
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
            {activeMissions}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            활성 미션
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-emerald-500">
            +{totalGranted}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            총 지급
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            href: "scan",
            icon: ScanLine,
            label: "미션 인증",
            bg: "bg-emerald-50 dark:bg-emerald-900/30",
            color: "text-emerald-500",
          },
          {
            href: "points",
            icon: Coins,
            label: `${market.pointLabel} 지급`,
            bg: "bg-purple-50 dark:bg-purple-900/30",
            color: "text-purple-500",
          },
          {
            href: "pos",
            icon: CreditCard,
            label: "물품 결제",
            bg: "bg-rose-50 dark:bg-rose-900/30",
            color: "text-rose-500",
          },
        ].map(({ href, icon: Icon, label, bg, color }) => (
          <Link
            key={href}
            href={`/markets/${marketId}/admin/${href}`}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {pendingLogs.length > 0 && (
        <Link
          href={`/markets/${marketId}/admin/activity?scope=pending`}
          className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 px-4 py-3.5 active:scale-95 transition-all"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <BellRing className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
            인증 대기 중인 미션이{" "}
            <span className="font-semibold">{pendingLogs.length}건</span> 있어요
          </p>
          <ArrowRight className="h-4 w-4 text-amber-500" />
        </Link>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            최근 활동
          </h2>
          <Link
            href={`/markets/${marketId}/admin/activity`}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const participantName =
                participantMap[log.userId]?.user.realName ?? "알 수 없음";
              return (
                <PointLogItem
                  key={log.id}
                  log={log}
                  pointLabel={market.pointLabel}
                  participantName={participantName}
                  onClick={() =>
                    openPointLogDetail({
                      log,
                      participantName,
                      pointLabel: market.pointLabel,
                      marketId,
                      isAdmin: true,
                    })
                  }
                />
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">
            아직 내역이 없어요
          </p>
        )}
      </div>
    </div>
  );
}
