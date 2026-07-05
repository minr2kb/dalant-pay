"use client";

import {
  ArrowLeftRight,
  Award,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { getPointLogSub, type Order, type PointLog } from "@/types";

interface PointLogItemProps {
  log: PointLog;
  order?: Order;
  pointLabel?: string;
  participantName?: string;
  onClick?: () => void;
}

export function PointLogItem({
  log,
  order,
  pointLabel = "달란트",
  participantName,
  onClick,
}: PointLogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = log.amount > 0;
  const isPurchase = log.reasonType === "purchase";

  const label =
    log.reasonType === "mission"
      ? (log.missionTitle ?? "미션")
      : isPurchase
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

  const amountColor = isPositive ? "text-emerald-500" : "text-rose-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={
          onClick ?? (() => isPurchase && order && setExpanded((v) => !v))
        }
        className={`flex w-full items-center justify-between px-4 py-4 text-left ${
          onClick || (isPurchase && order) ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {participantName && (
                <span className="font-medium">{participantName} · </span>
              )}
              {sub}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-600">
              {new Date(log.createdAt).toLocaleString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tabular-nums ${amountColor}`}>
            {isPositive ? "+" : ""}
            {log.amount}
          </span>
          {!onClick &&
            isPurchase &&
            order &&
            (expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-300" />
            ))}
        </div>
      </button>

      {expanded && order && (
        <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-2">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <ShoppingBag className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span>
                  {item.name} × {item.qty}
                </span>
              </div>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                {item.price * item.qty}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{order.verifiedByName} 처리</span>
            <span className="font-medium tabular-nums text-rose-400">
              -{order.total} 합계
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
