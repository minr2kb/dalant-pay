"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { AdminAccessButton } from "@/components/AdminAccessButton";
import { HomeScanButton } from "@/components/HomeScanButton";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { NumberTicker } from "@/components/NumberTicker";
import { PayQRButton } from "@/components/PayQRButton";
import { TransferModal } from "@/components/TransferModal";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";

export function UserHomeClient({
  marketId,
  userId,
}: {
  marketId: string;
  userId: string;
}) {
  const [{ data: market }, { data: participants }] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.get({ marketId, userId }),
    ],
  });

  const { participant: user, pointLogs } = participants;
  const recentLogs = useMemo(() => pointLogs.slice(0, 3), [pointLogs]);

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <InstallPwaBanner />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {market.title}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {user.displayName}
          </h1>
        </div>
        <AdminAccessButton marketId={marketId} compact />
      </div>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">
              보유 {market.pointLabel}
            </p>
            <NumberTicker
              value={user.balance}
              className="text-4xl font-bold tabular-nums"
            />
            <p className="text-sm opacity-70">{market.pointLabel}</p>
          </div>
          <PayQRButton
            marketId={marketId}
            userId={user.user.id}
            userName={user.user.realName}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="h-12 gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 rounded-2xl font-semibold"
          onClick={() =>
            openModal((close) => (
              <TransferModal
                marketId={marketId}
                userId={userId}
                onClose={close}
              />
            ))
          }
        >
          <ArrowRightLeft className="h-4 w-4" />
          {market.pointLabel} 전송
        </Button>
        <HomeScanButton marketId={marketId} pointLabel={market.pointLabel} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            최근 내역
          </h2>
          <Link
            href={`/markets/${marketId}/history`}
            className="flex items-center gap-1 text-xs text-emerald-500"
          >
            전체 보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentLogs.map((log, i) => {
            const label =
              log.reasonType === "mission"
                ? log.missionTitle
                : log.reasonType === "purchase"
                  ? log.itemName
                  : log.reasonType === "transfer"
                    ? (log.memo ?? `${market.pointLabel} 전송`)
                    : (log.memo ?? "수동 지급");
            const isPositive = log.amount > 0;

            return (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both"
                style={{ animationDelay: `${200 + i * 75}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${isPositive ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {isPositive ? "+" : ""}
                  {log.amount}
                </span>
              </div>
            );
          })}
          {recentLogs.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              아직 내역이 없어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
