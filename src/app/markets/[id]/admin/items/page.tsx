"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Suspense, use, useCallback, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalHistory } from "@/hooks/use-modal-history";
import { itemsQuery } from "@/lib/query/queries";
import type { MarketItem } from "@/types";

const EMPTY_FORM = { name: "", price: "" };

function AdminItemsGrid({ marketId }: { marketId: string }) {
  const { data: items } = useSuspenseQuery(itemsQuery.list({ marketId }));
  const createMutation = useMutation(
    itemsQuery.create({ invalidates: [itemsQuery.$key] }),
  );
  const updateMutation = useMutation(
    itemsQuery.update({ invalidates: [itemsQuery.$key] }),
  );
  const deleteMutation = useMutation(
    itemsQuery.delete({ invalidates: [itemsQuery.$key] }),
  );

  const [isReordering, setIsReordering] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);
  useModalHistory(sheetOpen, closeSheet);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function openEdit(item: MarketItem) {
    setEditingId(item.id);
    setForm({ name: item.name, price: String(item.price) });
    setSheetOpen(true);
  }

  async function submitForm() {
    if (!form.name.trim() || !form.price) return;
    const body = { name: form.name.trim(), price: Number(form.price) };
    if (editingId) {
      await updateMutation.mutateAsync({
        marketId,
        itemId: editingId,
        ...body,
      });
    } else {
      await createMutation.mutateAsync({ marketId, ...body });
    }
    window.history.back();
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length || isReordering) return;
    const a = items[index];
    const b = items[target];
    setIsReordering(true);
    try {
      await Promise.all([
        updateMutation.mutateAsync({
          marketId,
          itemId: a.id,
          sortOrder: b.sortOrder,
        }),
        updateMutation.mutateAsync({
          marketId,
          itemId: b.id,
          sortOrder: a.sortOrder,
        }),
      ]);
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative flex flex-col items-start gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
          >
            <button
              type="button"
              onClick={() => openEdit(item)}
              className="flex w-full flex-col items-start pr-6 text-left"
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {item.name}
              </p>
              <p className="text-base font-bold tabular-nums text-emerald-500">
                {item.price}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                deleteMutation.mutate({ marketId, itemId: item.id })
              }
              disabled={deleteMutation.isPending}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-rose-50 hover:text-rose-400 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="flex w-full items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0 || isReordering}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1 || isReordering}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
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

      <BottomSheet open={sheetOpen} onClose={() => window.history.back()}>
        <div className="px-6 pb-10 pt-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {editingId ? "물품 수정" : "새 물품"}
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
                물품명
              </p>
              <Input
                placeholder="물품명을 입력하세요"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                가격
              </p>
              <Input
                placeholder="0"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className="h-12 rounded-xl"
              />
            </div>
            <Button
              onClick={submitForm}
              disabled={!form.name.trim() || !form.price}
              className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              {editingId ? "저장하기" : "추가하기"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[76px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        />
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
