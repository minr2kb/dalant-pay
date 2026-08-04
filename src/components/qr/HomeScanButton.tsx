"use client";

import { useMutation, useQueries } from "@tanstack/react-query";
import { CheckCircle2, ScanLine, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSessionUserId } from "@/components/AuthGate";
import { Modal } from "@/components/Modal";
import { QRScanner } from "@/components/qr/QRScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/executor";
import { openModal } from "@/lib/overlay";
import { parseQR } from "@/lib/qr";
import {
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { firstChar } from "@/lib/utils";
import type { MarketParticipant } from "@/types";

type ScanTarget = {
  participant: MarketParticipant;
  missionId: string;
  token: string;
  missionTitle: string;
  reward: number;
  rewardMin: number | null;
  rewardMax: number | null;
};

function ConfirmModal({
  scanTarget,
  marketId,
  pointLabel,
  onClose,
  onSuccess,
}: {
  scanTarget: ScanTarget;
  marketId: string;
  pointLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [done, setDone] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [amount, setAmount] = useState(
    scanTarget.rewardMin !== null ? String(scanTarget.rewardMin) : "",
  );
  const [awardedReward, setAwardedReward] = useState(0);
  // 모달 하나(= 한 번의 인증 시도) 수명 동안 고정 — 재시도가 같은 키를 재사용해
  // 서버가 award_mission을 다시 안 태우고 첫 실행 결과를 그대로 돌려주게 한다.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const verifyMutation = useMutation(
    missionsQuery.verify({
      invalidates: [missionsQuery.$key, pointLogsQuery.$key],
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  );

  const isRanged =
    scanTarget.rewardMin !== null && scanTarget.rewardMax !== null;
  const amountValid =
    !isRanged ||
    (amount.trim() !== "" &&
      Number(amount) >= (scanTarget.rewardMin ?? 0) &&
      Number(amount) <= (scanTarget.rewardMax ?? 0));

  async function handleVerify() {
    if (!amountValid) return;
    setVerifyError(null);
    try {
      const result = await verifyMutation.mutateAsync({
        marketId,
        missionId: scanTarget.missionId,
        token: scanTarget.token,
        reward: isRanged ? Number(amount) : undefined,
      });
      setAwardedReward(result.reward);
      setDone(true);
    } catch (e) {
      setVerifyError(getApiErrorMessage(e, "인증에 실패했어요"));
    }
  }

  return (
    <Modal className="z-[70]" onClose={!done ? onClose : undefined}>
      <div className="p-6 space-y-5">
        {!done ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                미션 인증 요청
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {scanTarget.missionTitle}
              </p>
              {isRanged ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder={`${scanTarget.rewardMin}~${scanTarget.rewardMax}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 w-24 rounded-lg"
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {pointLabel} ({scanTarget.rewardMin}~{scanTarget.rewardMax}{" "}
                    범위)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{scanTarget.reward} {pointLabel}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {firstChar(scanTarget.participant.displayName)}
              </div>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {scanTarget.participant.displayName}님의 QR
              </p>
            </div>
            {verifyError && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-600">
                {verifyError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 flex-1 rounded-full text-sm font-semibold"
              >
                다시 스캔
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !amountValid}
                className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                인증하기
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-400" />
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                인증 완료!
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {scanTarget.participant.displayName}님 +{awardedReward}{" "}
                {pointLabel} 적립됨
              </p>
            </div>
            <Button
              onClick={onSuccess}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              확인
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function HomeScanButton({
  marketId,
  pointLabel,
}: {
  marketId: string;
  pointLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const userId = useSessionUserId();

  const [{ data: participants = [] }, { data: missions = [] }] = useQueries({
    queries: [
      participantsQuery.list({ marketId }),
      missionsQuery.list({ marketId }),
    ],
  });

  function handleScan(val: string) {
    const qr = parseQR(val);
    if (!qr || qr.type !== "mission") {
      if (qr?.type === "pay")
        toast.error("결제 QR이에요", {
          description: "달란트 전송 기능을 이용해주세요",
        });
      return;
    }
    const participant = participants.find((p) => p.user.id === qr.userId);
    const mission = missions.find((m) => m.id === qr.missionId);
    if (!participant) {
      toast.error("이 마켓의 참여자 QR이 아니에요");
      return;
    }
    if (!mission) {
      toast.error("인식할 수 없는 미션이에요");
      return;
    }
    if (mission.type !== "user_qr") {
      toast.error("관리자 인증이 필요한 미션이에요");
      return;
    }
    if (qr.userId === userId) {
      toast.error("본인의 QR은 인증할 수 없어요");
      return;
    }

    openModal((close) => (
      <ConfirmModal
        scanTarget={{
          participant,
          missionId: qr.missionId,
          token: qr.token,
          missionTitle: mission.title,
          reward: mission.reward,
          rewardMin: mission.rewardMin,
          rewardMax: mission.rewardMax,
        }}
        marketId={marketId}
        pointLabel={pointLabel}
        onClose={close}
        onSuccess={() => {
          close();
          setOpen(false);
        }}
      />
    ));
  }

  return (
    <>
      <Button
        className="h-12 w-full gap-2 rounded-2xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
        onClick={() => setOpen(true)}
      >
        <ScanLine className="h-4 w-4" />
        QR 인증해주기
      </Button>

      <QRScanner
        open={open}
        title="상대방 QR 스캔"
        hint="상대방의 미션 QR을 화면 중앙에 맞춰주세요"
        onScan={handleScan}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
