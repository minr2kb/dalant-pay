"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { keyBy } from "es-toolkit";
import { useMemo } from "react";
import { openPointLogDetail } from "@/components/PointLogDetailModal";
import { PointLogItem } from "@/components/PointLogItem";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
export function HistoryClient({
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

  const { participant: user, pointLogs: logs, orders } = participants;
  const orderMap = useMemo(() => keyBy(orders, (o) => o.id), [orders]);

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
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
