"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { openModal } from "@/lib/overlay";
import { missionsQuery } from "@/lib/query/queries";
import type { Mission, MissionType } from "@/types";
import { ActivateConfirmModal } from "./ActivateConfirmModal";
import { TYPE_DESC, TYPE_LABEL } from "./constants";

const EMPTY_FORM = {
  title: "",
  description: "",
  reward: "",
  isRanged: false,
  rewardMin: "",
  rewardMax: "",
  limitCount: "",
  type: "user_qr" as MissionType,
  isGroup: false,
  activeFrom: "",
  activeUntil: "",
};

function toForm(mission: Mission) {
  return {
    title: mission.title,
    description: mission.description ?? "",
    reward: String(mission.reward),
    isRanged: mission.rewardMin !== null && mission.rewardMax !== null,
    rewardMin: mission.rewardMin !== null ? String(mission.rewardMin) : "",
    rewardMax: mission.rewardMax !== null ? String(mission.rewardMax) : "",
    limitCount: mission.limitCount !== null ? String(mission.limitCount) : "",
    type: mission.type,
    isGroup: mission.isGroup,
    activeFrom: mission.activeFrom ? mission.activeFrom.slice(0, 10) : "",
    activeUntil: mission.activeUntil ? mission.activeUntil.slice(0, 10) : "",
  };
}

interface MissionFormModalProps {
  marketId: string;
  mission: Mission | null;
  onClose: () => void;
}

export function MissionFormModal({
  marketId,
  mission,
  onClose,
}: MissionFormModalProps) {
  const [form, setForm] = useState(mission ? toForm(mission) : EMPTY_FORM);

  const createMutation = useMutation(
    missionsQuery.create({ invalidates: [missionsQuery.$key] }),
  );
  const updateMutation = useMutation(
    missionsQuery.update({ invalidates: [missionsQuery.$key] }),
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

  const rangeValid =
    !form.isRanged ||
    (form.rewardMin.trim() !== "" &&
      form.rewardMax.trim() !== "" &&
      Number(form.rewardMax) >= Number(form.rewardMin));
  const canSubmit = form.title.trim() !== "" && rangeValid && !isPending;

  async function submitForm() {
    if (!canSubmit) return;
    const body = {
      title: form.title,
      description: form.description.trim() || undefined,
      reward: form.isRanged ? Number(form.rewardMin) : Number(form.reward) || 0,
      rewardMin: form.isRanged ? Number(form.rewardMin) : null,
      rewardMax: form.isRanged ? Number(form.rewardMax) : null,
      limitCount: form.limitCount.trim() ? Number(form.limitCount) : null,
      type: form.type,
      isGroup: form.isGroup,
      activeFrom: form.activeFrom || null,
      activeUntil: form.activeUntil || null,
    };
    if (mission) {
      await updateMutation.mutateAsync({
        marketId,
        missionId: mission.id,
        ...body,
      });
      onClose();
      return;
    }
    const created = await createMutation.mutateAsync({ marketId, ...body });
    onClose();
    openModal((close) => (
      <ActivateConfirmModal
        marketId={marketId}
        missionId={created.id}
        missionTitle={created.title}
        onClose={close}
      />
    ));
  }

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pb-8 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {mission ? "미션 수정" : "새 미션"}
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
              미션 이름
            </p>
            <Input
              placeholder="미션 이름을 입력하세요"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              설명{" "}
              <span className="text-gray-300 dark:text-gray-600">(선택)</span>
            </p>
            <textarea
              placeholder="미션에 대한 설명을 입력하세요"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              인증 방식
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                ["user_qr", "upload", "admin_qr", "manual"] as MissionType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      type: t,
                      isGroup: t === "user_qr" ? false : f.isGroup,
                    }))
                  }
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    form.type === t
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <p className="text-xs font-semibold">{TYPE_LABEL[t]}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${form.type === t ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {TYPE_DESC[t]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                달란트 수량
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                차등지급
                <Switch
                  checked={form.isRanged}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isRanged: v }))
                  }
                  className="data-[state=checked]:bg-emerald-500 scale-90"
                />
              </div>
            </div>
            {form.isRanged ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="최소"
                  type="number"
                  value={form.rewardMin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rewardMin: e.target.value }))
                  }
                  className="rounded-xl"
                />
                <Input
                  placeholder="최대"
                  type="number"
                  value={form.rewardMax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rewardMax: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            ) : (
              <Input
                placeholder="0"
                type="number"
                value={form.reward}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reward: e.target.value }))
                }
                className="rounded-xl"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              최대 횟수 (비우면 무제한)
            </p>
            <Input
              placeholder="무제한"
              type="number"
              value={form.limitCount}
              onChange={(e) =>
                setForm((f) => ({ ...f, limitCount: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                시작일 (선택)
              </p>
              <Input
                type="date"
                value={form.activeFrom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activeFrom: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                종료일 (선택)
              </p>
              <Input
                type="date"
                value={form.activeUntil}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activeUntil: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          {form.type !== "user_qr" && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  단체 미션
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  QR 스캔 시 함께 줄 인원 선택 가능
                </p>
              </div>
              <Switch
                checked={form.isGroup}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isGroup: v }))}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          )}

          <Button
            onClick={submitForm}
            disabled={!canSubmit}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {mission ? "저장하기" : "미션 추가"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
