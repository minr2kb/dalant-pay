"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { SAMPLE_ITEMS } from "../../data";

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

export default function SampleAdminItemsPage() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          물품 관리
        </h1>
      </div>

      <div className="flex flex-col gap-2">
        {SAMPLE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
          >
            <button
              type="button"
              onClick={tryOnly}
              className="shrink-0 touch-none cursor-grab p-1 text-gray-300 dark:text-gray-600"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={tryOnly}
              className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
            >
              <p
                className={`truncate text-sm font-semibold ${item.isActive ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}
              >
                {item.name}
              </p>
              <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-500">
                {item.price}
              </p>
            </button>

            <Switch
              checked={item.isActive}
              onCheckedChange={tryOnly}
              size="sm"
              className="shrink-0 data-[state=checked]:bg-emerald-500"
            />

            <button
              type="button"
              onClick={tryOnly}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-rose-50 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={tryOnly}
          className="flex items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-gray-400 dark:text-gray-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">물품 추가</span>
        </button>
      </div>
    </div>
  );
}
