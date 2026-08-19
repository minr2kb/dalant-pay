"use client";

import {
  useMutation,
  useQuery,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { CheckCircle2, Circle, Crown, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/executor";
import { openModal } from "@/lib/overlay";
import {
  groupsQuery,
  missionsQuery,
  participantsQuery,
} from "@/lib/query/queries";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  owner: "소유자",
  admin: "관리자",
  user: "참여자",
};

// 유저 리스트 뱃지(AdminUsersClient)와 같은 톤 - 오너=amber, 관리자=purple.
const ROLE_BADGE_STYLE: Record<Role, string> = {
  owner: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  admin:
    "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  user: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function PromoteOwnerConfirm({
  marketId,
  userId,
  displayName,
  onClose,
}: {
  marketId: string;
  userId: string;
  displayName: string;
  onClose: () => void;
}) {
  const { mutate, isPending } = useMutation(
    participantsQuery.promoteOwner({
      invalidates: [participantsQuery.$key],
      onSuccess: () => {
        toast.success("소유자로 지정했어요");
        onClose();
      },
      onError: () => toast.error("소유자 지정에 실패했어요"),
    }),
  );

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5 text-gray-900 dark:text-white">
        <h3 className="font-bold">소유자로 지정할까요?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {displayName}에게 마켓 설정을 포함한 모든 관리 권한을 부여해요.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            className="h-12 flex-1"
            onClick={() => mutate({ marketId, userId })}
            disabled={isPending}
          >
            {isPending ? "지정 중…" : "지정"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RevokeRoleConfirm({
  marketId,
  userId,
  displayName,
  roleLabel,
  onClose,
}: {
  marketId: string;
  userId: string;
  displayName: string;
  roleLabel: string;
  onClose: () => void;
}) {
  const { mutate, isPending } = useMutation(
    participantsQuery.revokeRole({
      invalidates: [participantsQuery.$key],
      onSuccess: () => {
        toast.success("권한을 박탈했어요");
        onClose();
      },
      onError: (e) =>
        toast.error(getApiErrorMessage(e, "권한 박탈에 실패했어요")),
    }),
  );

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5 text-gray-900 dark:text-white">
        <h3 className="font-bold">권한을 박탈할까요?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {displayName}의 {roleLabel} 권한을 거둬들이고 일반 참여자로 되돌려요.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            className="h-12 flex-1 bg-rose-500 hover:bg-rose-600"
            onClick={() => mutate({ marketId, userId })}
            disabled={isPending}
          >
            {isPending ? "박탈 중…" : "박탈"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GroupPickerModal({
  marketId,
  userId,
  currentGroupId,
  onClose,
}: {
  marketId: string;
  userId: string;
  currentGroupId: string | null;
  onClose: () => void;
}) {
  const { data: groups } = useQuery(groupsQuery.list({ marketId }));
  const { mutate, isPending } = useMutation(
    participantsQuery.assignGroup({
      invalidates: [participantsQuery.$key],
      onSuccess: onClose,
      onError: () => toast.error("그룹 배정에 실패했어요"),
    }),
  );

  function optionClass() {
    return "flex h-12 w-full items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-40";
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4 text-gray-900 dark:text-white">
        <h3 className="font-bold">그룹 선택</h3>
        {!groups ? (
          <p className="py-4 text-center text-sm text-gray-400">불러오는 중…</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            <button
              type="button"
              onClick={() => mutate({ marketId, userId, groupId: null })}
              disabled={isPending}
              className={optionClass()}
            >
              <span>그룹 없음</span>
              {currentGroupId === null ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              )}
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => mutate({ marketId, userId, groupId: g.id })}
                disabled={isPending}
                className={optionClass()}
              >
                <span>{g.name}</span>
                {currentGroupId === g.id ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                )}
              </button>
            ))}
            {groups.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                아직 그룹이 없어요
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function AdminUserDetailClient({
  marketId,
  userId,
  isOwner,
}: {
  marketId: string;
  userId: string;
  isOwner: boolean;
}) {
  const [
    {
      data: { participant },
    },
    { data: missions },
  ] = useSuspenseQueries({
    queries: [
      participantsQuery.get({ marketId, userId }),
      missionsQuery.list({ marketId, userId }),
    ],
  });

  const completedMissions = missions.filter((m) =>
    m.slots?.some((s) => s.verifiedAt !== null),
  );

  // 대상이 이미 소유자면 지정 버튼은 숨기고 박탈만, user면 액션 버튼 자체를 숨긴다.
  const canActOnRole = isOwner && participant.role !== "user";

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4 space-y-1">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            달란트 잔액
          </p>
          <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {participant.balance}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            미션 완료
          </p>
          <p className="text-2xl font-bold tabular-nums text-gray-700 dark:text-gray-300">
            {completedMissions.length}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">권한</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              ROLE_BADGE_STYLE[participant.role],
            )}
          >
            {ROLE_LABEL[participant.role]}
          </span>
        </div>
        {canActOnRole && (
          <div className="flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            {participant.role !== "owner" && (
              <Button
                variant="outline"
                className="h-10 flex-1 gap-1.5 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950"
                onClick={() =>
                  openModal((close) => (
                    <PromoteOwnerConfirm
                      marketId={marketId}
                      userId={userId}
                      displayName={participant.displayName}
                      onClose={close}
                    />
                  ))
                }
              >
                <Crown className="h-4 w-4" />
                소유자 지정
              </Button>
            )}
            <Button
              variant="outline"
              className="h-10 flex-1 gap-1.5 border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
              onClick={() =>
                openModal((close) => (
                  <RevokeRoleConfirm
                    marketId={marketId}
                    userId={userId}
                    displayName={participant.displayName}
                    roleLabel={ROLE_LABEL[participant.role]}
                    onClose={close}
                  />
                ))
              }
            >
              <ShieldOff className="h-4 w-4" />
              권한 박탈
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">그룹</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              participant.groupName
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
            )}
          >
            {participant.groupName ?? "없음"}
          </span>
        </div>
        <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
          <Button
            variant="outline"
            className="h-10 w-full gap-1.5"
            onClick={() =>
              openModal((close) => (
                <GroupPickerModal
                  marketId={marketId}
                  userId={userId}
                  currentGroupId={participant.groupId}
                  onClose={close}
                />
              ))
            }
          >
            <Users className="h-4 w-4" />
            그룹 변경
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          미션 현황
        </h2>
        <div className="space-y-2">
          {missions.map((m) => {
            const done =
              m.slots?.filter((s) => s.verifiedAt !== null).length ?? 0;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {m.title}
                </span>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {done}/{m.limitCount ?? "∞"}회
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
