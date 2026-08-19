"use client";

import { Camera, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MissionSlot } from "@/components/mission/MissionSlot";
import { formatReward, MISSION_TYPE_LABEL, type Mission } from "@/types";
import { SAMPLE_MARKET } from "../../data";

const QR_HINT: Record<string, string> = {
  user_qr: "유저 간 인증 미션: 상대방이 이 QR을 찍어줘야 해요",
  upload: "업로드형 미션: 관리자에게 QR을 보여주세요",
  admin_qr: "관리자 인증 미션: 관리자에게 QR을 보여주세요",
};

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

export function SampleMissionDetailClient({ mission }: { mission: Mission }) {
  const isUnlimited = mission.limitCount === null;
  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null);

  return (
    <div>
      <div className="sticky-header flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
        <Link
          href="/sample/missions"
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {mission.title}
        </h1>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {MISSION_TYPE_LABEL[mission.type]}
            </span>
            <span className="text-lg font-bold text-emerald-500">
              +{formatReward(mission)} {SAMPLE_MARKET.pointLabel}
            </span>
          </div>
          {mission.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {mission.description}
            </p>
          )}
          {mission.isGroup && (
            <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-600">
              단체 미션
            </span>
          )}
        </div>

        {mission.type === "manual" ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              관리자가 수동으로 지급하는 상시 미션이에요
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              별도 인증 없이 관리자가 직접 지급합니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mission.type === "upload" && (
              <button
                type="button"
                onClick={tryOnly}
                className="mx-auto flex aspect-square w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:border-emerald-300 hover:text-emerald-400 transition-colors"
              >
                <Camera className="h-6 w-6" />
              </button>
            )}
            <button
              type="button"
              onClick={tryOnly}
              className="mx-auto flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {nextPendingSlot
                ? `${nextPendingSlot.slot}회차 인증하기`
                : "인증하기"}
            </button>
            {QR_HINT[mission.type] && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {QR_HINT[mission.type]}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              인증 현황
            </h2>
            {isUnlimited && (
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                무제한
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {mission.slots?.map((slot) => (
              <MissionSlot key={slot.slot} slot={slot} slotNumber={slot.slot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
