"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Suspense, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatKST } from "@/lib/format-date";
import { openModal } from "@/lib/overlay";
import { missionsQuery } from "@/lib/query/queries";
import { formatReward, type Mission } from "@/types";
import { TYPE_LABEL } from "./constants";
import Loading from "./loading";
import { MissionFormModal } from "./MissionFormModal";

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
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    missionsQuery.update({ invalidates: [missionsQuery.$key] }),
  );
  const deleteMutation = useMutation(
    missionsQuery.delete({ invalidates: [missionsQuery.$key] }),
  );
  const reorderMutation = useMutation(
    missionsQuery.reorder({ invalidates: [missionsQuery.$key] }),
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openAdd() {
    openModal((close) => (
      <MissionFormModal marketId={marketId} mission={null} onClose={close} />
    ));
  }

  function openEdit(mission: Mission) {
    setExpandedId(null);
    openModal((close) => (
      <MissionFormModal marketId={marketId} mission={mission} onClose={close} />
    ));
  }

  async function toggleActive(missionId: string, current: boolean) {
    const { queryKey } = missionsQuery.list({ marketId });
    const previous = queryClient.getQueryData<Mission[]>(queryKey);
    queryClient.setQueryData<Mission[]>(queryKey, (old) =>
      old?.map((m) => (m.id === missionId ? { ...m, isActive: !current } : m)),
    );
    try {
      await updateMutation.mutateAsync({
        marketId,
        missionId,
        isActive: !current,
      });
    } catch (e) {
      queryClient.setQueryData(queryKey, previous);
      throw e;
    }
  }

  // optimistic으로 로컬 순서를 먼저 반영한 뒤, 전체 순서를 통째로 서버에 덮어써서
  // 항목별 부분 업데이트가 겹치며 나던 오류를 없앤다 (SE-14)
  async function moveMission(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= missions.length || reorderMutation.isPending)
      return;
    const next = [...missions];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    const { queryKey } = missionsQuery.list({ marketId });
    const previous = queryClient.getQueryData<Mission[]>(queryKey);
    queryClient.setQueryData<Mission[]>(
      queryKey,
      next.map((m, i) => ({ ...m, sortOrder: i })),
    );
    try {
      await reorderMutation.mutateAsync({
        marketId,
        missionIds: next.map((m) => m.id),
      });
    } catch (e) {
      queryClient.setQueryData(queryKey, previous);
      throw e;
    }
  }

  async function deleteMission(missionId: string) {
    await deleteMutation.mutateAsync({ marketId, missionId });
    if (expandedId === missionId) setExpandedId(null);
  }

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
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
        {missions.map((mission, index) => (
          <div
            key={mission.id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => moveMission(index, -1)}
                  disabled={index === 0 || reorderMutation.isPending}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-gray-600 dark:hover:text-gray-300"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveMission(index, 1)}
                  disabled={
                    index === missions.length - 1 || reorderMutation.isPending
                  }
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-gray-600 dark:hover:text-gray-300"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
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

                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      +{formatReward(mission)}
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
                  {(mission.activeFrom || mission.activeUntil) && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {formatPeriod(mission.activeFrom, mission.activeUntil)}
                    </p>
                  )}
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
                      +{formatReward(mission)}
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
