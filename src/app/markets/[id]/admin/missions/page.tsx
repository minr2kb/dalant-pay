"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { Suspense, use, useCallback, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useModalHistory } from "@/hooks/use-modal-history";
import { formatKST } from "@/lib/format-date";
import { missionsQuery } from "@/lib/query/queries";
import type { Mission, MissionType } from "@/types";
import Loading from "./loading";

const TYPE_LABEL: Record<MissionType, string> = {
  user_qr: "유저 간 인증",
  upload: "업로드형",
  admin_qr: "관리자 인증",
  manual: "상시",
};

const TYPE_DESC: Record<MissionType, string> = {
  user_qr: "상대방이 내 QR을 찍어줌",
  upload: "사진 업로드 후 관리자 QR",
  admin_qr: "관리자에게 직접 QR 인증",
  manual: "관리자가 수동 지급",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  reward: "",
  limitCount: "",
  type: "user_qr" as MissionType,
  isGroup: false,
  activeFrom: "",
  activeUntil: "",
};

function formatDate(d: string | null) {
  if (!d) return null;
  return formatKST(d, { month: "long", day: "numeric" });
}

function formatPeriod(from: string | null, until: string | null) {
  if (!from && !until) return "기간 제한 없음";
  if (from && until) return `${formatDate(from)} ~ ${formatDate(until)}`;
  if (from) return `${formatDate(from)}부터`;
  return `${formatDate(until)}까지`;
}

function AdminMissionsContent({ marketId }: { marketId: string }) {
  const { data: missions } = useSuspenseQuery(missionsQuery.list({ marketId }));

  const createMutation = useMutation(
    missionsQuery.create({ invalidates: [missionsQuery.$key] }),
  );
  const updateMutation = useMutation(
    missionsQuery.update({ invalidates: [missionsQuery.$key] }),
  );
  const deleteMutation = useMutation(
    missionsQuery.delete({ invalidates: [missionsQuery.$key] }),
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);
  useModalHistory(formOpen, closeForm);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(mission: Mission) {
    setEditingId(mission.id);
    setForm({
      title: mission.title,
      description: mission.description ?? "",
      reward: String(mission.reward),
      limitCount: mission.limitCount !== null ? String(mission.limitCount) : "",
      type: mission.type,
      isGroup: mission.isGroup,
      activeFrom: mission.activeFrom ? mission.activeFrom.slice(0, 10) : "",
      activeUntil: mission.activeUntil ? mission.activeUntil.slice(0, 10) : "",
    });
    setExpandedId(null);
    setFormOpen(true);
  }

  async function toggleActive(missionId: string, current: boolean) {
    await updateMutation.mutateAsync({
      marketId,
      missionId,
      isActive: !current,
    });
  }

  async function deleteMission(missionId: string) {
    await deleteMutation.mutateAsync({ marketId, missionId });
    if (expandedId === missionId) setExpandedId(null);
  }

  async function submitForm() {
    if (!form.title.trim()) return;
    const body = {
      title: form.title,
      description: form.description.trim() || undefined,
      reward: Number(form.reward) || 0,
      limitCount: form.limitCount.trim() ? Number(form.limitCount) : null,
      type: form.type,
      isGroup: form.isGroup,
      activeFrom: form.activeFrom || null,
      activeUntil: form.activeUntil || null,
    };
    if (editingId) {
      await updateMutation.mutateAsync({
        marketId,
        missionId: editingId,
        ...body,
      });
    } else {
      await createMutation.mutateAsync({ marketId, ...body });
    }
    window.history.back();
  }

  return (
    <>
      <div className="px-4 max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            미션 관리
          </h1>
          <Button
            onClick={openAdd}
            className="h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            미션 추가
          </Button>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === mission.id ? null : mission.id)
                  }
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${mission.isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {mission.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {TYPE_LABEL[mission.type]}
                      </span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">
                        ·
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        +{mission.reward}
                      </span>
                      {mission.limitCount !== null && (
                        <>
                          <span className="text-xs text-gray-300 dark:text-gray-600">
                            ·
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {mission.limitCount}회
                          </span>
                        </>
                      )}
                      {mission.isGroup && (
                        <>
                          <span className="text-xs text-gray-300 dark:text-gray-600">
                            ·
                          </span>
                          <span className="text-xs font-medium text-blue-500">
                            단체
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {expandedId === mission.id ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  )}
                </button>

                <Switch
                  checked={mission.isActive}
                  onCheckedChange={() =>
                    toggleActive(mission.id, mission.isActive)
                  }
                  className="data-[state=checked]:bg-emerald-500 shrink-0"
                />
              </div>

              {expandedId === mission.id && (
                <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="text-gray-400 dark:text-gray-500">
                        인증 방식
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {TYPE_LABEL[mission.type]}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-gray-500">보상</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        +{mission.reward}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-gray-500">
                        최대 횟수
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {mission.limitCount !== null
                          ? `${mission.limitCount}회`
                          : "무제한"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 dark:text-gray-500">
                        단체 미션
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {mission.isGroup ? "예" : "아니오"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 dark:text-gray-500">
                        활성화 기간
                      </p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">
                        {formatPeriod(mission.activeFrom, mission.activeUntil)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(mission)}
                      className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Pencil className="h-3 w-3" /> 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMission(mission.id)}
                      className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" /> 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {missions.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              등록된 미션이 없어요
            </p>
          )}
        </div>
      </div>

      <BottomSheet open={formOpen} onClose={() => window.history.back()}>
        <div className="px-6 pb-10 pt-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {editingId ? "미션 수정" : "새 미션"}
            </h2>
            <button
              type="button"
              onClick={() => window.history.back()}
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
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  달란트 수량
                </p>
                <Input
                  placeholder="0"
                  type="number"
                  value={form.reward}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reward: e.target.value }))
                  }
                  className="rounded-xl"
                />
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

            <Button
              onClick={submitForm}
              disabled={!form.title.trim()}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              {editingId ? "저장하기" : "미션 추가"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

export default function AdminMissionsPage(
  props: PageProps<"/markets/[id]/admin/missions">,
) {
  const { id: marketId } = use(props.params);
  return (
    <Suspense fallback={<Loading />}>
      <AdminMissionsContent marketId={marketId} />
    </Suspense>
  );
}
