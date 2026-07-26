"use client";

import { Clock } from "lucide-react";
import type { PendingMissionLog } from "@/types";

export function PendingMissionLogItem({
  log,
  participantName,
  onClick,
}: {
  log: PendingMissionLog;
  participantName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 text-left"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {log.missionTitle}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          <span className="font-medium">{participantName}</span> · 인증 대기
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        대기중
      </span>
    </button>
  );
}
