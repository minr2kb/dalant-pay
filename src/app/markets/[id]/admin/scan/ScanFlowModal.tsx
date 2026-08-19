"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useState } from "react";
import { GroupParticipantPicker } from "@/components/GroupParticipantPicker";
import { Modal } from "@/components/Modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMissionVerify } from "@/hooks/use-mission-verify";
import {
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import { firstChar } from "@/lib/utils";
import {
  formatReward,
  hasRewardRange,
  type MarketParticipant,
  type Mission,
} from "@/types";

type Step = "picking_mission" | "picking_user" | "confirm" | "group" | "done";

export function ScanFlowModal({
  marketId,
  pointLabel,
  missions,
  participants,
  initialMission,
  initialUser,
  initialToken,
  onClose,
}: {
  marketId: string;
  pointLabel: string;
  missions: Mission[];
  participants: MarketParticipant[];
  initialMission?: Mission;
  initialUser?: MarketParticipant;
  initialToken?: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(
    initialMission && initialUser ? "confirm" : "picking_mission",
  );
  const [selectedMission, setSelectedMission] = useState<Mission | null>(
    initialMission ?? null,
  );
  const [selectedUser, setSelectedUser] = useState<MarketParticipant | null>(
    initialUser ?? null,
  );
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [amount, setAmount] = useState(
    initialMission?.rewardMin != null ? String(initialMission.rewardMin) : "",
  );
  const [awardedReward, setAwardedReward] = useState(0);
  const { verifyGroup, isPending } = useMissionVerify({
    invalidates: [
      missionsQuery.$key,
      participantsQuery.$key,
      pointLogsQuery.$key,
    ],
  });

  // react-query를 타야 참여자가 confirm 화면이 떠 있는 동안 재업로드해도
  // uploadPhoto mutation의 invalidates(missionsQuery.$key)로 최신 사진을 다시 받아온다 -
  // 이전 raw fetch는 이 캐시 시스템 밖에 있어 재업로드를 감지하지 못했다.
  const { data: pendingMission } = useQuery({
    ...missionsQuery.get({
      marketId,
      missionId: selectedMission?.id ?? "",
      userId: selectedUser?.user.id ?? "",
    }),
    enabled:
      step === "confirm" &&
      selectedMission?.type === "upload" &&
      !!selectedUser,
  });
  const pendingPhotoUrl =
    pendingMission?.slots?.find((s) => s.verifiedAt === null)?.photoUrl ?? null;

  function selectMission(mission: Mission) {
    setSelectedMission(mission);
    setAmount(mission.rewardMin != null ? String(mission.rewardMin) : "");
    setStep(selectedUser ? "confirm" : "picking_user");
  }

  function selectUser(participant: MarketParticipant) {
    setSelectedUser(participant);
    setStep("confirm");
  }

  function toggleGroupUser(uid: string) {
    setGroupUsers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    );
  }

  const isRanged = !!selectedMission && hasRewardRange(selectedMission);
  const amountValid =
    !isRanged ||
    (amount.trim() !== "" &&
      Number(amount) >= (selectedMission?.rewardMin ?? 0) &&
      Number(amount) <= (selectedMission?.rewardMax ?? 0));

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!selectedMission || !selectedUser || !amountValid) return;
    const reward = isRanged ? Number(amount) : undefined;
    const succeeded = await verifyGroup(
      marketId,
      selectedMission.id,
      initialToken ? { token: initialToken } : { userId: selectedUser.user.id },
      extraUserIds,
      reward,
    );
    if (succeeded) {
      setAwardedReward(reward ?? selectedMission.reward);
      setStep("done");
    }
  }

  const otherParticipants = participants.filter(
    (p) => p.user.id !== selectedUser?.user.id,
  );
  const teammates = selectedUser?.groupId
    ? otherParticipants.filter((p) => p.groupId === selectedUser.groupId)
    : [];

  if (step === "picking_mission") {
    return (
      <Modal className="z-[70]" onClose={onClose}>
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            어떤 미션인가요?
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {missions.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                활성 미션이 없어요
              </p>
            ) : (
              missions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMission(m)}
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {m.title}
                  </span>
                  <span className="text-sm font-bold text-emerald-500">
                    +{formatReward(m)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    );
  }

  if (step === "picking_user" && selectedMission) {
    return (
      <Modal className="z-[70]" onClose={onClose}>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              누구의 QR인가요?
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedMission.title} +{formatReward(selectedMission)}{" "}
              {pointLabel}
            </p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {participants.map((p) => (
              <button
                key={p.user.id}
                type="button"
                onClick={() => selectUser(p)}
                className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={p.user.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{firstChar(p.user.realName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {p.user.realName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.balance} {pointLabel} 보유
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  if (step === "group" && selectedMission && selectedUser) {
    return (
      <Modal className="z-[70]" onClose={onClose}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              단체 미션: 함께한 참여자
            </h3>
          </div>
          {teammates.length > 0 && (
            <button
              type="button"
              onClick={() => setGroupUsers(teammates.map((p) => p.user.id))}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <UserPlus className="h-3 w-3" /> {selectedUser.groupName} 팀 전체
              선택
            </button>
          )}
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

  if (step === "done" && selectedMission) {
    return (
      <Modal className="z-[70]" onClose={onClose}>
        <div className="p-6 flex flex-col items-center gap-4 py-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              적립 완료!
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedMission.title} +{awardedReward} {pointLabel}
            </p>
          </div>
          <Button
            onClick={onClose}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            확인
          </Button>
        </div>
      </Modal>
    );
  }

  if (!selectedMission || !selectedUser) return null;
  return (
    <Modal className="z-[70]" onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400">미션 인증 요청</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {selectedMission.title}
          </h3>
          {isRanged ? (
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                placeholder={`${selectedMission.rewardMin}~${selectedMission.rewardMax}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 w-28 rounded-xl"
              />
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {pointLabel} ({selectedMission.rewardMin}~
                {selectedMission.rewardMax} 범위)
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedUser.user.realName} +{selectedMission.reward}{" "}
              {pointLabel}
            </p>
          )}
        </div>
        {selectedMission.type === "upload" &&
          (pendingPhotoUrl ? (
            // biome-ignore lint/performance/noImgElement: admin verification preview from a dynamic Supabase storage URL, not a build-time asset next/image can optimize
            <img
              src={pendingPhotoUrl}
              alt=""
              className="mx-auto aspect-square w-40 rounded-xl object-cover"
            />
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                업로드된 인증 사진이 없어요
              </p>
            </div>
          ))}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 flex-1 rounded-full text-sm font-semibold"
          >
            취소
          </Button>
          <Button
            onClick={() =>
              selectedMission.isGroup ? setStep("group") : confirmVerify()
            }
            disabled={
              isPending ||
              !amountValid ||
              (selectedMission.type === "upload" && !pendingPhotoUrl)
            }
            className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
}
