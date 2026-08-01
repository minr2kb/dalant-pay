"use client";

import { SAMPLE_MARKET, SAMPLE_MISSIONS } from "../../data";

export default function SampleAdminHomePage() {
  const activeMissions = SAMPLE_MISSIONS.filter((m) => m.isActive).length;

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {SAMPLE_MARKET.title} · 관리자
      </h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            진행중 미션
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeMissions}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">참여자</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            48명
          </p>
        </div>
      </div>
    </div>
  );
}
