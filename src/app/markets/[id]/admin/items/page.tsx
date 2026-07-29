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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimisticReorder } from "@/hooks/use-optimistic-reorder";
import { openModal } from "@/lib/overlay";
import { itemsQuery } from "@/lib/query/queries";
import type { MarketItem } from "@/types";
import { ItemFormModal } from "./ItemFormModal";

function SortableItemCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: MarketItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 ${isDragging ? "relative z-10 opacity-90 shadow-lg" : ""}`}
    >
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
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col items-start pr-5 text-left"
      >
        <p className="w-full truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
          {item.name}
        </p>
        <p className="text-base font-bold tabular-nums text-emerald-500">
          {item.price}
        </p>
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-rose-50 hover:text-rose-400 disabled:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AdminItemsGrid({ marketId }: { marketId: string }) {
  const { data: items } = useSuspenseQuery(itemsQuery.list({ marketId }));
  const deleteMutation = useMutation(
    itemsQuery.delete({ invalidates: [itemsQuery.$key] }),
  );
  const reorderMutation = useMutation(
    itemsQuery.reorder({ invalidates: [itemsQuery.$key] }),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function openAdd() {
    openModal((close) => (
      <ItemFormModal marketId={marketId} item={null} onClose={close} />
    ));
  }

  function openEdit(item: MarketItem) {
    openModal((close) => (
      <ItemFormModal marketId={marketId} item={item} onClose={close} />
    ));
  }

  const handleDragEnd = useOptimisticReorder(
    itemsQuery.list({ marketId }).queryKey,
    items,
    (itemIds) => reorderMutation.mutateAsync({ marketId, itemIds }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <SortableItemCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() =>
                deleteMutation.mutate({ marketId, itemId: item.id })
              }
              deleting={deleteMutation.isPending}
            />
          ))}

          <button
            type="button"
            onClick={openAdd}
            className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-gray-400 dark:text-gray-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">물품 추가</span>
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[76px] rounded-2xl" />
      ))}
    </div>
  );
}

function AdminItemsContent({ marketId }: { marketId: string }) {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
        <Link
          href={`/markets/${marketId}/admin/home`}
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          물품 관리
        </h1>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <AdminItemsGrid marketId={marketId} />
      </Suspense>
    </div>
  );
}

export default function AdminItemsPage(
  props: PageProps<"/markets/[id]/admin/items">,
) {
  const { id: marketId } = use(props.params);
  return <AdminItemsContent marketId={marketId} />;
}
