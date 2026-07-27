"use client";

import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemsQuery } from "@/lib/query/queries";
import type { MarketItem } from "@/types";

interface ItemFormModalProps {
  marketId: string;
  item: MarketItem | null;
  onClose: () => void;
}

export function ItemFormModal({ marketId, item, onClose }: ItemFormModalProps) {
  const [form, setForm] = useState(
    item
      ? { name: item.name, price: String(item.price) }
      : { name: "", price: "" },
  );

  const createMutation = useMutation(
    itemsQuery.create({ invalidates: [itemsQuery.$key] }),
  );
  const updateMutation = useMutation(
    itemsQuery.update({ invalidates: [itemsQuery.$key] }),
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function submitForm() {
    if (!form.name.trim() || !form.price) return;
    const body = { name: form.name.trim(), price: Number(form.price) };
    if (item) {
      await updateMutation.mutateAsync({ marketId, itemId: item.id, ...body });
    } else {
      await createMutation.mutateAsync({ marketId, ...body });
    }
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pb-8 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {item ? "물품 수정" : "새 물품"}
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
              물품명
            </p>
            <Input
              placeholder="물품명을 입력하세요"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
            disabled={!form.name.trim() || !form.price || isPending}
            className="h-12 w-full rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {item ? "저장하기" : "추가하기"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
