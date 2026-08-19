"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/executor";
import { openModal } from "@/lib/overlay";
import { groupsQuery } from "@/lib/query/queries";
import type { Group } from "@/types";

interface GroupFormModalProps {
  marketId: string;
  group: Group | null;
  onClose: () => void;
}

export function GroupFormModal({
  marketId,
  group,
  onClose,
}: GroupFormModalProps) {
  const [name, setName] = useState(group?.name ?? "");

  const createMutation = useMutation(
    groupsQuery.create({ invalidates: [groupsQuery.$key] }),
  );
  const updateMutation = useMutation(
    groupsQuery.update({ invalidates: [groupsQuery.$key] }),
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function submitForm() {
    if (!name.trim()) return;
    try {
      if (group) {
        await updateMutation.mutateAsync({
          marketId,
          groupId: group.id,
          name: name.trim(),
        });
      } else {
        await createMutation.mutateAsync({ marketId, name: name.trim() });
      }
      onClose();
    } catch (e) {
      const message = getApiErrorMessage(e, "저장에 실패했어요");
      toast.error(message);
      if (message.includes("플랜")) {
        openModal((close) => <UpgradeModal reason={message} onClose={close} />);
      }
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pb-8 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {group ? "그룹 수정" : "새 그룹"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              그룹명
            </p>
            <Input
              placeholder="예: A팀"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            onClick={submitForm}
            disabled={!name.trim() || isPending}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {group ? "저장하기" : "추가하기"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
