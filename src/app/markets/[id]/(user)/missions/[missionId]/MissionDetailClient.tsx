"use client";

import * as Sentry from "@sentry/nextjs";
import { useMutation, useSuspenseQueries } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MissionSlot } from "@/components/mission/MissionSlot";
import { QRModal } from "@/components/qr/QRModal";
import { getApiErrorMessage } from "@/lib/api/executor";
import { formatKST } from "@/lib/format-date";
import { marketsQuery, missionsQuery } from "@/lib/query/queries";
import { SessionExpiredError, uploadMissionPhoto } from "@/lib/upload";
import { formatReward, getMissionStatus, MISSION_TYPE_LABEL } from "@/types";

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
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const fromTab = useSearchParams().get("from");
  const backHref = fromTab
    ? `/markets/${marketId}/missions?tab=${fromTab}`
    : `/markets/${marketId}/missions`;

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
  const deletePhotoMutation = useMutation(
    missionsQuery.deletePhoto({
      invalidates: [missionsQuery.$key],
      onSuccess: () => toast.success("취소됐어요"),
      onError: () =>
        toast.error("삭제에 실패했어요", { description: "다시 시도해주세요" }),
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
  // upload형 미션은 사진 없이도(사진 없이 인증 요청) 대기 상태로 들어갈 수 있어서,
  // "제출은 됐다"는 pendingPhotoUrl(사진 유무)이 아니라 requested(로그 존재 여부)로
  // 판단한다 - limitCount가 있는 미션은 아직 안 건드린 슬롯도 자리만 채워서 내려오므로
  // nextPendingSlot 존재만으로는 "실제로 요청함"과 "아직 시도 안 함"을 구분 못 한다
  const isAwaitingReview =
    mission.type === "upload" && !!nextPendingSlot?.requested;
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
        predictedSlot,
      );
    } catch (e) {
      setUploadError(true);
      // 압축/스토리지 업로드 실패는 그동안 여기서 조용히 삼켜져서 Sentry에 하나도
      // 안 잡혔다 - try/catch로 잡은 예외는 자동 계측 대상이 아니라 직접 보내야 한다.
      Sentry.captureException(e);
      if (e instanceof SessionExpiredError) {
        toast.error(e.message);
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
      } else {
        toast.error("사진 업로드에 실패했어요", {
          description: "네트워크 상태를 확인하고 다시 시도해주세요",
        });
      }
      setUploading(false);
      return;
    }
    try {
      await uploadPhotoMutation.mutateAsync({ marketId, missionId, photoUrl });
    } catch (e) {
      setUploadError(true);
      Sentry.captureException(e);
      const msg = getApiErrorMessage(e, "다시 시도해주세요");
      toast.error("미션 등록에 실패했어요", { description: msg });
    } finally {
      setUploading(false);
    }
  }

  // 사진 업로드가 계속 실패할 때(압축/네트워크/브라우저 문제)의 탈출구 - 사진 없이
  // 인증 대기 상태로 등록해서 관리자가 다른 방식으로 확인 후 승인할 수 있게 한다
  async function handleManualRequest() {
    try {
      await uploadPhotoMutation.mutateAsync({
        marketId,
        missionId,
        photoUrl: undefined,
      });
      setUploadError(false);
    } catch (e) {
      Sentry.captureException(e);
      const msg = getApiErrorMessage(e, "다시 시도해주세요");
      toast.error("인증 요청에 실패했어요", { description: msg });
    }
  }

  return (
    <div>
      <div className="sticky-header flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
        <Link href={backHref} className="text-gray-400 dark:text-gray-500">
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
                    ) : isAwaitingReview && !pendingPhotoUrl ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="text-xs font-medium">
                          인증 대기 중
                        </span>
                      </div>
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
                  <div className="space-y-1.5 text-center">
                    <p className="text-xs text-red-500">
                      업로드 실패. 다시 시도해주세요
                    </p>
                    {!isAwaitingReview && (
                      <button
                        type="button"
                        onClick={handleManualRequest}
                        disabled={uploadPhotoMutation.isPending}
                        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500"
                      >
                        {uploadPhotoMutation.isPending
                          ? "요청 중…"
                          : "사진 없이 인증 요청"}
                      </button>
                    )}
                  </div>
                )}
                {!isAwaitingReview && !uploadError && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    사진을 업로드해야 QR을 생성할 수 있어요
                  </p>
                )}
                {isAwaitingReview && !pendingPhotoUrl && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    사진 없이 인증 요청했어요. 관리자 확인을 기다려주세요
                  </p>
                )}
                {isAwaitingReview && (
                  <button
                    type="button"
                    onClick={() =>
                      deletePhotoMutation.mutate({ marketId, missionId })
                    }
                    disabled={deletePhotoMutation.isPending || uploading}
                    className="mx-auto block text-center text-xs text-gray-400 underline underline-offset-2 hover:text-rose-400 disabled:opacity-40 dark:text-gray-500"
                  >
                    {deletePhotoMutation.isPending
                      ? "취소 중…"
                      : pendingPhotoUrl
                        ? "사진 삭제"
                        : "인증 요청 취소"}
                  </button>
                )}
              </div>
            )}
            {canVerify && (
              <QRModal
                marketId={marketId}
                missionId={missionId}
                userId={userId}
                missionTitle={mission.title}
                slot={predictedSlot}
                hint={QR_HINT[mission.type]}
                disabled={mission.type === "upload" && !isAwaitingReview}
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
