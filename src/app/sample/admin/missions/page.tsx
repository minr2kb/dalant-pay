"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatKST } from "@/lib/format-date";
import { formatReward, MISSION_TYPE_LABEL, type Mission } from "@/types";
import { SAMPLE_MISSIONS } from "../../data";

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

function formatPeriod(from: string | null, until: string | null) {
  if (!from && !until) return "기간 제한 없음";
  const fmt = (d: string) => formatKST(d, { month: "long", day: "numeric" });
  if (from && until) return `${fmt(from)} ~ ${fmt(until)}`;
  if (from) return `${fmt(from)}부터`;
  return `${fmt(until as string)}까지`;
}

function MissionRow({ mission }: { mission: Mission }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${mission.isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
            >
              {mission.title}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {MISSION_TYPE_LABEL[mission.type]}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{formatReward(mission)}
              </span>
              {mission.limitCount !== null && (
                <>
                  <span className="text-xs text-gray-300 dark:text-gray-600">
                    ·
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {mission.limitCount}회
                  </span>
                </>
              )}
              {mission.isGroup && (
                <>
                  <span className="text-xs text-gray-300 dark:text-gray-600">
                    ·
                  </span>
                  <span className="text-xs font-medium text-blue-500">
                    단체
                  </span>
                </>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          )}
        </button>
        <Switch
          checked={mission.isActive}
          onCheckedChange={tryOnly}
          className="data-[state=checked]:bg-emerald-500 shrink-0"
        />
      </div>

      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400 dark:text-gray-500">인증 방식</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {MISSION_TYPE_LABEL[mission.type]}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">보상</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                +{formatReward(mission)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">최대 횟수</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {mission.limitCount !== null
                  ? `${mission.limitCount}회`
                  : "무제한"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">단체 미션</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {mission.isGroup ? "예" : "아니오"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 dark:text-gray-500">활성화 기간</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {formatPeriod(mission.activeFrom, mission.activeUntil)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={tryOnly}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil className="h-3 w-3" /> 수정
            </button>
            <button
              type="button"
              onClick={tryOnly}
              className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" /> 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SampleAdminMissionsPage() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          미션 관리
        </h1>
        <Button
          onClick={tryOnly}
          className="h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          미션 추가
        </Button>
      </div>
      <div className="space-y-3">
        {SAMPLE_MISSIONS.map((mission) => (
          <MissionRow key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}
