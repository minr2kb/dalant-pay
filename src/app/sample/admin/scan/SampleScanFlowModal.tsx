"use client";

import { CheckCircle2, UserPlus } from "lucide-react";
import { useState } from "react";
import { GroupParticipantPicker } from "@/components/GroupParticipantPicker";
import { Modal } from "@/components/Modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { firstChar } from "@/lib/utils";
import { formatReward, type MarketParticipant, type Mission } from "@/types";
import {
  SAMPLE_MARKET,
  SAMPLE_MISSIONS,
  SAMPLE_PARTICIPANTS,
} from "../../data";

type Step = "picking_mission" | "picking_user" | "confirm" | "group" | "done";

// 실제 관리자 QR 스캔 화면에서도 admin_qr/upload 타입만 "수동인증"으로 고를 수 있다
// (user_qr은 참여자끼리, manual은 별도 지급 화면에서 처리) - 같은 필터를 그대로 쓴다.
const SCANNABLE_MISSIONS = SAMPLE_MISSIONS.filter(
  (m) => m.isActive && (m.type === "admin_qr" || m.type === "upload"),
);

export function SampleScanFlowModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("picking_mission");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedUser, setSelectedUser] = useState<MarketParticipant | null>(
    null,
  );
  const [groupUsers, setGroupUsers] = useState<string[]>([]);

  function selectMission(mission: Mission) {
    setSelectedMission(mission);
    setStep("picking_user");
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

  function confirmVerify() {
    setStep("done");
  }

  const otherParticipants = SAMPLE_PARTICIPANTS.filter(
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
          <div className="space-y-2">
            {SCANNABLE_MISSIONS.map((m) => (
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
            ))}
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
              {SAMPLE_MARKET.pointLabel}
            </p>
          </div>
          <div className="space-y-2">
            {SAMPLE_PARTICIPANTS.map((p) => (
              <button
                key={p.user.id}
                type="button"
                onClick={() => selectUser(p)}
                className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 text-left hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>{firstChar(p.user.realName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {p.user.realName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.balance} {SAMPLE_MARKET.pointLabel} 보유
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
            onClick={confirmVerify}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
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
              적립 완료! (체험용)
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedMission.title} +{formatReward(selectedMission)}{" "}
              {SAMPLE_MARKET.pointLabel}
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
            {selectedUser.user.realName} +{selectedMission.reward}{" "}
            {SAMPLE_MARKET.pointLabel}
          </p>
        </div>
        {selectedMission.type === "upload" && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              체험용이라 인증 사진은 생략할게요
            </p>
          </div>
        )}
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
            className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
}
