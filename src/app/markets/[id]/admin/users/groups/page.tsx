"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { Suspense, use } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { openModal } from "@/lib/overlay";
import { groupsQuery, participantsQuery } from "@/lib/query/queries";
import type { Group } from "@/types";
import { GroupFormModal } from "./GroupFormModal";
import { GroupMembersModal } from "./GroupMembersModal";

function GroupCard({
  group,
  memberCount,
  onEdit,
  onDelete,
  onManageMembers,
}: {
  group: Group;
  memberCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onManageMembers: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <button
        type="button"
        onClick={onManageMembers}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Users className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
          {group.name}
        </span>
        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {memberCount}명
        </span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-rose-50 hover:text-rose-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AdminGroupsHeader({ marketId }: { marketId: string }) {
  function openAdd() {
    openModal((close) => (
      <GroupFormModal marketId={marketId} group={null} onClose={close} />
    ));
  }

  return (
    <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
      <Link
        href={`/markets/${marketId}/admin/users`}
        className="text-gray-400 dark:text-gray-500"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-white">
        그룹 관리
      </h1>
      <Button
        onClick={openAdd}
        className="h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-sm"
      >
        <Plus className="mr-1 h-4 w-4" />
        그룹 추가
      </Button>
    </div>
  );
}

function AdminGroupsList({ marketId }: { marketId: string }) {
  const { data: groups } = useSuspenseQuery(groupsQuery.list({ marketId }));
  const { data: participants } = useSuspenseQuery(
    participantsQuery.list({ marketId }),
  );
  const deleteMutation = useMutation(
    groupsQuery.delete({
      invalidates: [groupsQuery.$key, participantsQuery.$key],
    }),
  );

  const memberCounts = new Map<string, number>();
  for (const p of participants) {
    if (p.groupId)
      memberCounts.set(p.groupId, (memberCounts.get(p.groupId) ?? 0) + 1);
  }

  function openEdit(group: Group) {
    openModal((close) => (
      <GroupFormModal marketId={marketId} group={group} onClose={close} />
    ));
  }

  function openMembers(group: Group) {
    openModal((close) => (
      <GroupMembersModal marketId={marketId} group={group} onClose={close} />
    ));
  }

  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">
        아직 그룹이 없어요
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          memberCount={memberCounts.get(group.id) ?? 0}
          onEdit={() => openEdit(group)}
          onDelete={() =>
            deleteMutation.mutate({ marketId, groupId: group.id })
          }
          onManageMembers={() => openMembers(group)}
        />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[52px] rounded-2xl" />
      ))}
    </div>
  );
}

export default function AdminGroupsPage(
  props: PageProps<"/markets/[id]/admin/users/groups">,
) {
  const { id: marketId } = use(props.params);
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <AdminGroupsHeader marketId={marketId} />

      <Suspense fallback={<ListSkeleton />}>
        <AdminGroupsList marketId={marketId} />
      </Suspense>
    </div>
  );
}
