"use client";

import { CheckCircle2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { GroupParticipantPicker } from "@/components/GroupParticipantPicker";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useMissionVerify } from "@/hooks/use-mission-verify";
import { missionsQuery, participantsQuery } from "@/lib/query/queries";
import type { MarketParticipant, Mission } from "@/types";

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
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const { verifyGroup, isPending } = useMissionVerify({
    invalidates: [missionsQuery.$key, participantsQuery.$key],
  });

  useEffect(() => {
    if (step !== "confirm" || !selectedMission || !selectedUser) return;
    if (selectedMission.type !== "upload") return;
    setPendingPhotoUrl(null);
    fetch(
      `/api/markets/${marketId}/missions/${selectedMission.id}?userId=${selectedUser.user.id}`,
    )
      .then((res) => res.json())
      .then(
        ({
          data,
        }: {
          data: {
            slots?: { verifiedAt: string | null; photoUrl: string | null }[];
          };
        }) => {
          const pendingSlot = data.slots?.find((s) => s.verifiedAt === null);
          setPendingPhotoUrl(pendingSlot?.photoUrl ?? null);
        },
      );
  }, [step, selectedMission, selectedUser, marketId]);

  function selectMission(mission: Mission) {
    setSelectedMission(mission);
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

  async function confirmVerify(extraUserIds: string[] = []) {
    if (!selectedMission || !selectedUser) return;
    const succeeded = await verifyGroup(
      marketId,
      selectedMission.id,
      initialToken ? { token: initialToken } : { userId: selectedUser.user.id },
      extraUserIds,
    );
    if (succeeded) setStep("done");
  }

  const otherParticipants = participants.filter(
    (p) => p.user.id !== selectedUser?.user.id,
  );

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
                    +{m.reward}
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
              {selectedMission.title} · +{selectedMission.reward} {pointLabel}
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300">
                  {p.user.realName[0]}
                </div>
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
          <GroupParticipantPicker
            participants={otherParticipants}
            selected={groupUsers}
            onToggle={toggleGroupUser}
          />
          <Button
            onClick={() => confirmVerify(groupUsers)}
            disabled={isPending}
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
              {selectedMission.title} · +{selectedMission.reward} {pointLabel}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedUser.user.realName} · +{selectedMission.reward}{" "}
            {pointLabel}
          </p>
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
            disabled={isPending}
            className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
}
