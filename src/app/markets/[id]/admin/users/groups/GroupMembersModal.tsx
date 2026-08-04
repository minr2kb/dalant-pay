"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import { participantsQuery } from "@/lib/query/queries";
import type { Group, MarketParticipant } from "@/types";

function ReassignConfirm({
  participantName,
  fromGroupName,
  toGroupName,
  onConfirm,
  onClose,
}: {
  participantName: string;
  fromGroupName: string;
  toGroupName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5 text-gray-900 dark:text-white">
        <h3 className="font-bold">팀을 옮길까요?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {participantName}님은 이미 {fromGroupName} 소속이에요. {toGroupName}
          (으)로 옮기면 {fromGroupName}에서는 빠져요.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            className="h-12 flex-1"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            이동
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GroupMembersPicker({
  marketId,
  group,
  participants,
  onClose,
}: {
  marketId: string;
  group: Group;
  participants: MarketParticipant[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(
    () =>
      new Set(
        participants
          .filter((p) => p.groupId === group.id)
          .map((p) => p.user.id),
      ),
  );
  const assignMutation = useMutation(
    participantsQuery.assignGroup({ invalidates: [participantsQuery.$key] }),
  );

  function toggle(p: MarketParticipant) {
    const turningOn = !selected.has(p.user.id);
    if (turningOn && p.groupId && p.groupId !== group.id) {
      openModal((close) => (
        <ReassignConfirm
          participantName={p.user.realName}
          fromGroupName={p.groupName ?? ""}
          toGroupName={group.name}
          onConfirm={() => setSelected((prev) => new Set(prev).add(p.user.id))}
          onClose={close}
        />
      ));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(p.user.id) ? next.delete(p.user.id) : next.add(p.user.id);
      return next;
    });
  }

  async function apply() {
    const original = new Set(
      participants.filter((p) => p.groupId === group.id).map((p) => p.user.id),
    );
    const toAdd = [...selected].filter((id) => !original.has(id));
    const toRemove = [...original].filter((id) => !selected.has(id));
    await Promise.allSettled([
      ...toAdd.map((userId) =>
        assignMutation.mutateAsync({ marketId, userId, groupId: group.id }),
      ),
      ...toRemove.map((userId) =>
        assignMutation.mutateAsync({ marketId, userId, groupId: null }),
      ),
    ]);
    onClose();
  }

  return (
    <>
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {participants.map((p) => {
          const checked = selected.has(p.user.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p)}
              className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${
                checked
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <span>{p.user.realName}</span>
              <span className="flex items-center gap-2">
                {!checked && p.groupId && p.groupId !== group.id && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {p.groupName}
                  </span>
                )}
                {checked ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                )}
              </span>
            </button>
          );
        })}
        {participants.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">
            참여자가 없어요
          </p>
        )}
      </div>
      <Button
        onClick={apply}
        disabled={assignMutation.isPending}
        className="mt-4 h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
      >
        {selected.size > 0 ? `${selected.size}명 적용` : "적용"}
      </Button>
    </>
  );
}

export function GroupMembersModal({
  marketId,
  group,
  onClose,
}: {
  marketId: string;
  group: Group;
  onClose: () => void;
}) {
  const { data: participants } = useQuery(participantsQuery.list({ marketId }));

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pb-8 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {group.name} 멤버
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {!participants ? (
          <p className="py-4 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : (
          <GroupMembersPicker
            marketId={marketId}
            group={group}
            participants={participants}
            onClose={onClose}
          />
        )}
      </div>
    </Modal>
  );
}
