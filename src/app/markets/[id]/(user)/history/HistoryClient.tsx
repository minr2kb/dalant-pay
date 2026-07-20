"use client";

import { useIsRestoring, useQueries } from "@tanstack/react-query";
import { keyBy } from "es-toolkit";
import { useMemo } from "react";
import { useSessionUserId } from "@/components/AuthGate";
import { openPointLogDetail } from "@/components/PointLogDetailModal";
import { PointLogItem } from "@/components/PointLogItem";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { HistorySkeleton } from "./HistorySkeleton";

export function HistoryClient({ marketId }: { marketId: string }) {
  const userId = useSessionUserId();
  const isRestoring = useIsRestoring();

  const [{ data: market }, { data: participants }] = useQueries({
    queries: [
      { ...marketsQuery.get({ marketId }), enabled: !!userId },
      {
        ...participantsQuery.get({ marketId, userId: userId ?? "" }),
        enabled: !!userId,
      },
    ],
  });

  const orderMap = useMemo(
    () => keyBy(participants?.orders ?? [], (o) => o.id),
    [participants],
  );

  if (isRestoring || !market || !participants) return <HistorySkeleton />;

  const { participant: user, pointLogs: logs } = participants;

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="sticky-header -mx-4 flex items-baseline justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {market.pointLabel} 내역
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          잔액{" "}
          <span className="font-bold text-emerald-500">
            {user.balance} {market.pointLabel}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <PointLogItem
            key={log.id}
            log={log}
            pointLabel={market.pointLabel}
            onClick={() =>
              openPointLogDetail({
                log,
                participantName: user.displayName,
                pointLabel: market.pointLabel,
                order: log.orderId ? orderMap[log.orderId] : undefined,
              })
            }
          />
        ))}
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            아직 내역이 없어요
          </p>
        )}
      </div>
    </div>
  );
}
