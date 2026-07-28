"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Suspense, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";
import { formatKST } from "@/lib/format-date";
import { openModal } from "@/lib/overlay";
import { missionsQuery } from "@/lib/query/queries";
import { formatReward, MISSION_TYPE_LABEL, type Mission } from "@/types";
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

function SortableMissionRow({
  mission,
  expanded,
  onToggleExpand,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  mission: Mission;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mission.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden ${isDragging ? "relative z-10 opacity-90 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 touch-none cursor-grab p-1 text-gray-300 active:cursor-grabbing dark:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
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
                {MISSION_TYPE_LABEL[mission.type]}
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
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          )}
        </button>

        <Switch
          checked={mission.isActive}
          onCheckedChange={onToggleActive}
          className="data-[state=checked]:bg-emerald-500 shrink-0"
        />
      </div>

      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400 dark:text-gray-500">인증 방식</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {MISSION_TYPE_LABEL[mission.type]}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">보상</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                +{formatReward(mission)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">최대 횟수</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {mission.limitCount !== null
                  ? `${mission.limitCount}회`
                  : "무제한"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">단체 미션</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {mission.isGroup ? "예" : "아니오"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 dark:text-gray-500">활성화 기간</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {formatPeriod(mission.activeFrom, mission.activeUntil)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil className="h-3 w-3" /> 수정
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" /> 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMissionsHeader({ marketId }: { marketId: string }) {
  function openAdd() {
    openModal((close) => (
      <MissionFormModal marketId={marketId} mission={null} onClose={close} />
    ));
  }

  return (
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
  );
}

function AdminMissionsList({ marketId }: { marketId: string }) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDragEnd = useOptimisticReorder(
    missionsQuery.list({ marketId }).queryKey,
    missions,
    (missionIds) => reorderMutation.mutateAsync({ marketId, missionIds }),
  );

  async function deleteMission(missionId: string) {
    await deleteMutation.mutateAsync({ marketId, missionId });
    if (expandedId === missionId) setExpandedId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={missions.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {missions.map((mission) => (
            <SortableMissionRow
              key={mission.id}
              mission={mission}
              expanded={expandedId === mission.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === mission.id ? null : mission.id)
              }
              onToggleActive={() => toggleActive(mission.id, mission.isActive)}
              onEdit={() => openEdit(mission)}
              onDelete={() => deleteMission(mission.id)}
            />
          ))}
          {missions.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              등록된 미션이 없어요
            </p>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default function AdminMissionsPage(
  props: PageProps<"/markets/[id]/admin/missions">,
) {
  const { id: marketId } = use(props.params);
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <AdminMissionsHeader marketId={marketId} />
      <Suspense fallback={<Loading />}>
        <AdminMissionsList marketId={marketId} />
      </Suspense>
    </div>
  );
}
