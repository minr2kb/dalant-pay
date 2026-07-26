"use client";

import { ArrowLeftRight, Award, ShoppingBag, TrendingUp } from "lucide-react";
import { formatKST } from "@/lib/format-date";
import { getPointLogSub, type PointLog } from "@/types";

interface PointLogItemProps {
  log: PointLog;
  pointLabel?: string;
  participantName?: string;
  onClick: () => void;
}

export function PointLogItem({
  log,
  pointLabel = "달란트",
  participantName,
  onClick,
}: PointLogItemProps) {
  const isPositive = log.amount > 0;

  const label =
    log.reasonType === "mission"
      ? (log.missionTitle ?? "미션")
      : log.reasonType === "purchase"
        ? (log.itemName ?? "마켓 구매")
        : log.reasonType === "transfer"
          ? (log.memo ?? `${pointLabel} 전송`)
          : (log.memo ?? "수동 지급");

  const sub = getPointLogSub(log, pointLabel);

  const Icon =
    log.reasonType === "purchase"
      ? ShoppingBag
      : log.reasonType === "manual"
        ? Award
        : log.reasonType === "transfer"
          ? ArrowLeftRight
          : TrendingUp;

  const isVoided = !!log.voidedAt;
  const amountColor = isVoided
    ? "text-gray-400 dark:text-gray-600"
    : isPositive
      ? "text-emerald-500"
      : "text-rose-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 text-left ${isVoided ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {label}
            {isVoided && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                철회됨
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {participantName && (
              <span className="font-medium">{participantName} · </span>
            )}
            {sub}
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            {formatKST(log.createdAt, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <span
        className={`text-sm font-bold tabular-nums ${amountColor} ${isVoided ? "line-through" : ""}`}
      >
        {isPositive ? "+" : ""}
        {log.amount}
      </span>
    </button>
  );
}
