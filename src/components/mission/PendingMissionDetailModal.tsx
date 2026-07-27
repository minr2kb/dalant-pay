"use client";

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
  const [step, setStep] = useState<"detail" | "group">("detail");
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

        <Button
          onClick={() => (log.isGroup ? setStep("group") : confirmVerify())}
          disabled={isPending || !amountValid}
          className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          인증해주기
        </Button>
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
