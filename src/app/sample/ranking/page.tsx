"use client";

import { SAMPLE_MARKET, SAMPLE_RANKING } from "../data";

export default function SampleRankingPage() {
  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {SAMPLE_MARKET.pointLabel} 랭킹
      </h1>
      <div className="space-y-2">
        {SAMPLE_RANKING.map((entry, index) => (
          <div
            key={entry.displayName}
            className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-sm font-bold text-gray-400">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entry.displayName}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums text-emerald-500">
              {entry.balance.toLocaleString()}
              {SAMPLE_MARKET.pointLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
