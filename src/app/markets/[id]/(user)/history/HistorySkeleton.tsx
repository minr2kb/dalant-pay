import { Skeleton } from "@/components/ui/skeleton";

export function HistorySkeleton() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between pt-4 pb-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
