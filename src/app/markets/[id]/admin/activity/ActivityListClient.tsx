"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { keyBy } from "es-toolkit";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { openPendingMissionDetail } from "@/components/mission/PendingMissionDetailModal";
import { PendingMissionLogItem } from "@/components/mission/PendingMissionLogItem";
import { openPointLogDetail } from "@/components/points/PointLogDetailModal";
import { PointLogItem } from "@/components/points/PointLogItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { POINT_LOG_CATEGORY, type PointReasonType } from "@/types";

type TypeFilter = PointReasonType | "all";
type ScopeFilter = "all" | "mine" | "pending";

const TYPE_FILTER_LABEL: Record<TypeFilter, string> = {
  all: "전체 유형",
  ...Object.fromEntries(
    Object.entries(POINT_LOG_CATEGORY).map(([key, { label }]) => [key, label]),
  ),
} as Record<TypeFilter, string>;

export function ActivityListClient({
  marketId,
  currentUserId,
}: {
  marketId: string;
  currentUserId: string | null;
}) {
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<ScopeFilter>(
    searchParams.get("scope") === "pending" ? "pending" : "all",
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [
    { data: market },
    { data: participants },
    { data: logs },
    { data: pendingLogs },
  ] = useSuspenseQueries({
    queries: [
      marketsQuery.get({ marketId }),
      participantsQuery.list({ marketId }),
      pointLogsQuery.list({ marketId }),
      missionsQuery.pendingLogs({ marketId }),
    ],
  });

  const participantMap = keyBy(participants, (p) => p.user.id);
  const visibleLogs = logs
    .filter((l) =>
      scope === "mine" && currentUserId
        ? l.userId === currentUserId || l.verifiedByUserId === currentUserId
        : true,
    )
    .filter((l) => typeFilter === "all" || l.reasonType === typeFilter);

  return (
    <div className="px-4 max-w-lg mx-auto space-y-4">
      <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
        <Link
          href={`/markets/${marketId}/admin/home`}
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          전체 활동
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {currentUserId &&
          (
            [
              { type: "all", label: "전체" },
              { type: "mine", label: "내 활동" },
              { type: "pending", label: "인증 대기" },
            ] as const
          ).map(({ type, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setScope(type)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                scope === type
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        {scope !== "pending" && (
          <>
            <div className="w-px shrink-0 self-stretch bg-gray-200 dark:bg-gray-700" />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger
                size="sm"
                className="h-9 gap-1 rounded-full border-none bg-gray-100 px-4 text-gray-500 hover:bg-gray-200 data-[size=sm]:h-9 data-[size=sm]:rounded-full dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <SelectValue placeholder="전체 유형">
                  {(value: TypeFilter) => TYPE_FILTER_LABEL[value ?? "all"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-gray-100 bg-white p-1.5 shadow-lg ring-0 dark:border-gray-800 dark:bg-gray-900">
                {(Object.keys(TYPE_FILTER_LABEL) as TypeFilter[]).map(
                  (type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="rounded-xl py-2 pl-3 text-gray-700 focus:bg-gray-50 dark:text-gray-300 dark:focus:bg-gray-800"
                    >
                      {TYPE_FILTER_LABEL[type]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {scope === "pending" ? (
        pendingLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            인증 대기 중인 미션이 없어요
          </div>
        ) : (
          <div className="space-y-2">
            {pendingLogs.map((log) => {
              const participantName =
                participantMap[log.userId]?.user.realName ?? "알 수 없음";
              return (
                <PendingMissionLogItem
                  key={log.id}
                  log={log}
                  participantName={participantName}
                  onClick={() =>
                    openPendingMissionDetail({
                      log,
                      participantName,
                      marketId,
                      participants,
                    })
                  }
                />
              );
            })}
          </div>
        )
      ) : visibleLogs.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          활동 내역이 없어요
        </div>
      ) : (
        <div className="space-y-2">
          {visibleLogs.map((log) => {
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
      )}
    </div>
  );
}
