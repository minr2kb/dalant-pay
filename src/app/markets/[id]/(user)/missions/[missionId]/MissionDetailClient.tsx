"use client";

import { useMutation, useSuspenseQueries } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MissionSlot } from "@/components/mission/MissionSlot";
import { QRModal } from "@/components/qr/QRModal";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatKST } from "@/lib/format-date";
import { marketsQuery, missionsQuery } from "@/lib/query/queries";
import { uploadMissionPhoto } from "@/lib/upload";
import { formatReward, getMissionStatus } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  user_qr: "유저 간 인증",
  upload: "업로드형",
  admin_qr: "관리자 인증",
  manual: "상시",
};

const QR_HINT: Record<string, string> = {
  user_qr: "유저 간 인증 미션: 상대방이 이 QR을 찍어줘야 해요",
  upload: "업로드형 미션: 관리자에게 QR을 보여주세요",
  admin_qr: "관리자 인증 미션: 관리자에게 QR을 보여주세요",
};

export function MissionDetailClient({
  marketId,
  missionId,
  userId,
}: {
  marketId: string;
  missionId: string;
  userId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const [{ data: mission }, { data: market }] = useSuspenseQueries({
    queries: [
      missionsQuery.get({ marketId, missionId, userId }),
      marketsQuery.get({ marketId }),
    ],
  });

  const uploadPhotoMutation = useMutation(
    missionsQuery.uploadPhoto({
      invalidates: [missionsQuery.$key],
    }),
  );

  const isUnlimited = mission.limitCount === null;
  const nextPendingSlot = mission.slots?.find((s) => s.verifiedAt === null);
  const missionStatus = getMissionStatus(mission);
  const isPast = missionStatus === "past";
  const isUpcoming = missionStatus === "upcoming";
  // 무제한 미션은 slots에 완료 로그만 내려오므로 nextPendingSlot이 절대 안 잡힘 → 잠그지 않는다
  const isUserDone =
    !isUnlimited && !nextPendingSlot && (mission.slots?.length ?? 0) > 0;
  const isLocked = isPast || isUserDone;
  const canVerify = isUnlimited || !!nextPendingSlot;
  const pendingPhotoUrl = nextPendingSlot?.photoUrl ?? null;
  // 무제한 미션에서 아직 미인증 로그가 없을 때의 다음 slot 번호 예측 (서버의 resolveNextSlot과 동일한 규칙)
  const predictedSlot =
    nextPendingSlot?.slot ?? (mission.slots?.length ?? 0) + 1;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setUploadError(false);
    let photoUrl: string;
    try {
      photoUrl = await uploadMissionPhoto(
        file,
        marketId,
        missionId,
        userId,
        predictedSlot,
      );
    } catch {
      setUploadError(true);
      toast.error("사진 업로드에 실패했어요", {
        description: "네트워크 상태를 확인하고 다시 시도해주세요",
      });
      setUploading(false);
      return;
    }
    try {
      await uploadPhotoMutation.mutateAsync({ marketId, missionId, photoUrl });
    } catch (e) {
      setUploadError(true);
      const msg = getApiErrorMessage(e, "다시 시도해주세요");
      toast.error("미션 등록에 실패했어요", { description: msg });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="sticky-header flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
        <Link
          href={`/markets/${marketId}/missions`}
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
              {TYPE_LABEL[mission.type]}
            </span>
            <span className="text-lg font-bold text-emerald-500">
              +{formatReward(mission)} {market.pointLabel}
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

        {isUpcoming ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5 text-center space-y-1.5">
            <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              아직 시작되지 않은 미션이에요
            </p>
            {mission.activeFrom && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatKST(mission.activeFrom, {
                  month: "long",
                  day: "numeric",
                })}
                부터 인증할 수 있어요
              </p>
            )}
          </div>
        ) : isLocked ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5 text-center space-y-1.5">
            <CheckCircle2 className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {isPast ? "기간이 종료된 미션이에요" : "이미 완료한 미션이에요"}
            </p>
          </div>
        ) : mission.type === "manual" ? (
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
              <div className="space-y-2">
                <label className="relative mx-auto flex aspect-square w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:border-emerald-300 hover:text-emerald-400 transition-colors">
                  {pendingPhotoUrl && (
                    // biome-ignore lint/performance/noImgElement: small upload preview thumbnail from a dynamic Supabase storage URL, not a build-time asset next/image can optimize
                    <img
                      src={pendingPhotoUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div
                    className={
                      pendingPhotoUrl
                        ? "relative flex h-full w-full items-center justify-center bg-black/40 text-white"
                        : ""
                    }
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-6 w-6" />
                        {pendingPhotoUrl && (
                          <span className="text-xs font-medium">다시 촬영</span>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileChange}
                  />
                </label>
                {uploadError && (
                  <p className="text-center text-xs text-red-500">
                    업로드 실패. 다시 시도해주세요
                  </p>
                )}
                {!pendingPhotoUrl && !uploadError && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    사진을 업로드해야 QR을 생성할 수 있어요
                  </p>
                )}
              </div>
            )}
            {canVerify && (
              <QRModal
                marketId={marketId}
                missionId={missionId}
                userId={userId}
                missionTitle={mission.title}
                hint={QR_HINT[mission.type]}
                disabled={mission.type === "upload" && !pendingPhotoUrl}
                buttonText={
                  nextPendingSlot
                    ? `${nextPendingSlot.slot}회차 인증하기`
                    : "인증하기"
                }
              />
            )}
            {mission.type === "admin_qr" && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                관리자에게 직접 가서 이 QR을 보여주세요
              </p>
            )}
            {mission.type === "user_qr" && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                내 QR을 보여주면 상대방이 홈 화면에서 스캔해줘요
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
            {isUnlimited && !isPast && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-gray-300 dark:text-gray-600">
                <span className="text-sm">계속 인증할 수 있어요</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
