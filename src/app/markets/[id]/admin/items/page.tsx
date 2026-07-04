"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemsQuery } from "@/lib/query/queries";

function AdminItemsList({ marketId }: { marketId: string }) {
  const { data: items } = useSuspenseQuery(itemsQuery.list({ marketId }));
  const deleteMutation = useMutation(
    itemsQuery.delete({ invalidates: [itemsQuery.$key] }),
  );

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        등록된 물품이 없어요
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {item.name}
            </p>
            <p className="text-xs tabular-nums text-emerald-500">
              {item.price}
            </p>
          </div>
          <button
            type="button"
            onClick={() => deleteMutation.mutate({ marketId, itemId: item.id })}
            disabled={deleteMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-400 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[60px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

// full-route skeleton (shown during navigation, before this component mounts) lives in ./loading.tsx

function AdminItemsContent({ marketId }: { marketId: string }) {
  const createMutation = useMutation(
    itemsQuery.create({ invalidates: [itemsQuery.$key] }),
  );
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  async function addItem() {
    if (!newName.trim() || !newPrice) return;
    await createMutation.mutateAsync({
      marketId,
      name: newName.trim(),
      price: Number(newPrice),
    });
    setNewName("");
    setNewPrice("");
  }

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
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

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          새 물품 추가
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="물품명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="h-12 flex-1 rounded-xl"
          />
          <Input
            placeholder="가격"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="h-12 w-24 rounded-xl"
          />
        </div>
        <Button
          onClick={addItem}
          disabled={!newName.trim() || !newPrice || createMutation.isPending}
          className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          추가하기
        </Button>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <AdminItemsList marketId={marketId} />
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
