"use client";

import { useMutation } from "@tanstack/react-query";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { missionsQuery } from "@/lib/query/queries";

interface ActivateConfirmModalProps {
  marketId: string;
  missionId: string;
  missionTitle: string;
  onClose: () => void;
}

export function ActivateConfirmModal({
  marketId,
  missionId,
  missionTitle,
  onClose,
}: ActivateConfirmModalProps) {
  const updateMutation = useMutation(
    missionsQuery.update({ invalidates: [missionsQuery.$key] }),
  );

  async function activate() {
    await updateMutation.mutateAsync({ marketId, missionId, isActive: true });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4 text-center">
        <p className="text-base font-bold text-gray-900 dark:text-white">
          "{missionTitle}" 미션을 만들었어요
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          지금 바로 활성화해서 참여자에게 보여줄까요?
          <br />
          나중에 미션 목록에서 켤 수도 있어요
        </p>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            나중에
          </Button>
          <Button
            className="h-12 flex-1"
            onClick={activate}
            disabled={updateMutation.isPending}
          >
            지금 활성화
          </Button>
        </div>
      </div>
    </Modal>
  );
}
