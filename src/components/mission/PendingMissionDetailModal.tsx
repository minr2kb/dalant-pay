"use client";

import { useMutation } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GroupParticipantPicker } from "@/components/GroupParticipantPicker";
import { openImageViewer } from "@/components/ImageViewer";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMissionVerify } from "@/hooks/use-mission-verify";
import { openModal } from "@/lib/overlay";
import {
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import {
  hasRewardRange,
  type MarketParticipant,
  type PendingMissionLog,
} from "@/types";

function PendingMissionDetail({
  log,
  participantName,
  marketId,
  participants,
  onClose,
}: {
  log: PendingMissionLog;
  participantName: string;
  marketId: string;
  participants: MarketParticipant[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<"detail" | "group" | "reject">("detail");
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [amount, setAmount] = useState(
    log.rewardMin !== null ? String(log.rewardMin) : "",
  );
  const { verifyGroup, isPending } = useMissionVerify({
    invalidates: [
      missionsQuery.$key,
      participantsQuery.$key,
      pointLogsQuery.$key,
    ],
  });
  const { mutate: deletePhoto, isPending: isDeleting } = useMutation(
    missionsQuery.deletePhoto({
      invalidates: [missionsQuery.$key],
      onSuccess: () => {
        toast.success("반려했어요");
        onClose();
      },
      onError: () => toast.error("반려에 실패했어요"),
    }),
  );

  const isRanged = hasRewardRange(log);
  const amountValid =
    !isRanged ||
    (amount.trim() !== "" &&
      Number(amount) >= (log.rewardMin ?? 0) &&
      Number(amount) <= (log.rewardMax ?? 0));

  function toggleGroupUser(uid: string) {
    setGroupUsers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    );
  }

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!amountValid) return;
    const succeeded = await verifyGroup(
      marketId,
      log.missionId,
      { userId: log.userId, slot: log.slot },
      extraUserIds,
      isRanged ? Number(amount) : undefined,
    );
    if (succeeded) {
      toast.success("인증 완료");
      onClose();
    }
  }

  const otherParticipants = participants.filter(
    (p) => p.user.id !== log.userId,
  );

  if (step === "reject") {
    return (
      <Modal onClose={onClose}>
        <div className="p-6 space-y-5 text-gray-900 dark:text-white">
          <h3 className="font-bold">반려할까요?</h3>
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {participantName}의 {log.missionTitle} 인증 대기 건이 반려돼요.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              사진이 지워지고 다시 업로드할 수 있는 상태로 돌아가요. 아직 지급
              전이라 잔액은 영향받지 않아요.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setStep("detail")}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              className="h-12 flex-1 bg-rose-500 hover:bg-rose-600"
              onClick={() =>
                deletePhoto({
                  marketId,
                  missionId: log.missionId,
                  userId: log.userId,
                })
              }
              disabled={isDeleting}
            >
              {isDeleting ? "반려 중…" : "반려"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === "group") {
    return (
      <Modal onClose={onClose}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              단체 미션: 함께한 참여자
            </h3>
          </div>
          <GroupParticipantPicker
            participants={otherParticipants}
            selected={groupUsers}
            onToggle={toggleGroupUser}
          />
          <Button
            onClick={() => confirmVerify(groupUsers)}
            disabled={isPending || !amountValid}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {groupUsers.length > 0
              ? `${groupUsers.length + 1}명 적립`
              : "본인만 적립"}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              인증 대기
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {log.missionTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">참여자</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {participantName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">보상</span>
            {isRanged ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={`${log.rewardMin}~${log.rewardMax}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-9 w-24 rounded-lg text-right"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({log.rewardMin}~{log.rewardMax})
                </span>
              </div>
            ) : (
              <span className="font-bold tabular-nums text-emerald-500">
                +{log.reward}
              </span>
            )}
          </div>
        </div>

        {log.photoUrl && (
          <button
            type="button"
            onClick={() => openImageViewer(log.photoUrl as string)}
            className="mx-auto aspect-square w-32 overflow-hidden rounded-xl"
          >
            {/** biome-ignore lint/performance/noImgElement: thumbnail only */}
            <img
              src={log.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-full border-rose-200 px-5 text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
            onClick={() => setStep("reject")}
            disabled={isPending}
          >
            반려
          </Button>
          <Button
            onClick={() => (log.isGroup ? setStep("group") : confirmVerify())}
            disabled={isPending || !amountValid}
            className="h-12 flex-1 rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            인증해주기
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function openPendingMissionDetail({
  log,
  participantName,
  marketId,
  participants,
}: {
  log: PendingMissionLog;
  participantName: string;
  marketId: string;
  participants: MarketParticipant[];
}) {
  openModal((close) => (
    <PendingMissionDetail
      log={log}
      participantName={participantName}
      marketId={marketId}
      participants={participants}
      onClose={close}
    />
  ));
}
