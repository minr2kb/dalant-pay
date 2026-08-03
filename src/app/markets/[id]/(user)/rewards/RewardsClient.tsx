"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { itemsQuery } from "@/lib/query/queries";

function RewardsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-[52px] rounded-2xl" />
      ))}
    </div>
  );
}

export function RewardsClient({ marketId }: { marketId: string }) {
  const { data: items } = useQuery(itemsQuery.list({ marketId }));

  const activeItems = items?.filter((item) => item.isActive);

  return (
    <div className="px-4 pb-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
        <Link
          href={`/markets/${marketId}/missions`}
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          보상목록
        </h1>
      </div>

      {!activeItems ? (
        <RewardsSkeleton />
      ) : activeItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          등록된 보상이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-baseline justify-between gap-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
            >
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                {item.name}
              </p>
              <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-500">
                {item.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
