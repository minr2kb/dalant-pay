"use client";

import { QrCode } from "lucide-react";
import { formatKST } from "@/lib/format-date";
import { formatReward } from "@/types";
import { SAMPLE_BALANCE, SAMPLE_MARKET, SAMPLE_MISSIONS } from "../data";

export default function SampleHomePage() {
  const recent = SAMPLE_MISSIONS[0];

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {SAMPLE_MARKET.title}
      </h1>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white space-y-4">
        <p className="text-sm text-white/80">내 {SAMPLE_MARKET.pointLabel}</p>
        <p className="text-3xl font-bold tabular-nums">
          {SAMPLE_BALANCE.toLocaleString()}
          {SAMPLE_MARKET.pointLabel}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-white/80">
          <QrCode className="h-4 w-4" />
          결제 QR (체험용, 스캔 불가)
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          최근 내역
        </p>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {recent.title}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatKST(
                recent.slots?.[0]?.verifiedAt ?? SAMPLE_MARKET.createdAt,
                {
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
          </div>
          <span className="text-sm font-bold text-emerald-500">
            +{formatReward(recent)}
          </span>
        </div>
      </div>
    </div>
  );
}
