"use client";

import { toast } from "sonner";
import { formatReward, MISSION_TYPE_LABEL } from "@/types";
import { SAMPLE_MISSIONS } from "../../data";

export default function SampleAdminMissionsPage() {
  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        미션 관리
      </h1>
      <div className="space-y-3">
        {SAMPLE_MISSIONS.map((mission) => (
          <button
            key={mission.id}
            type="button"
            onClick={() => toast("샘플 마켓에서는 체험만 가능해요")}
            className="w-full text-left rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {mission.title}
              </span>
              <span className="text-sm font-bold text-emerald-500">
                +{formatReward(mission)}
              </span>
            </div>
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {MISSION_TYPE_LABEL[mission.type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
