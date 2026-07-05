"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import {
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import type { PendingMissionLog } from "@/types";

function PendingMissionDetail({
  log,
  participantName,
  marketId,
  onClose,
}: {
  log: PendingMissionLog;
  participantName: string;
  marketId: string;
  onClose: () => void;
}) {
  const verifyMutation = useMutation(
    missionsQuery.verify({
      invalidates: [
        missionsQuery.$key,
        participantsQuery.$key,
        pointLogsQuery.$key,
      ],
    }),
  );

  async function handleVerify() {
    try {
      await verifyMutation.mutateAsync({
        marketId,
        missionId: log.missionId,
        userId: log.userId,
        slot: log.slot,
      });
      toast.success("인증 완료");
      onClose();
    } catch (e) {
      const msg =
        (e as { body?: { error?: string } })?.body?.error ??
        "인증에 실패했어요";
      toast.error(msg);
    }
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
            <span className="font-bold tabular-nums text-emerald-500">
              +{log.reward}
            </span>
          </div>
        </div>

        {log.photoUrl && (
          <div className="grid grid-cols-3 gap-2">
            {log.photoUrl.split(",").map((url) => (
              // biome-ignore lint/performance/noImgElement: <explanation>
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        <Button
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
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
}: {
  log: PendingMissionLog;
  participantName: string;
  marketId: string;
}) {
  openModal((close) => (
    <PendingMissionDetail
      log={log}
      participantName={participantName}
      marketId={marketId}
      onClose={close}
    />
  ));
}
