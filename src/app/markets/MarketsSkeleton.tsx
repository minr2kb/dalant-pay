import { Skeleton } from "@/components/ui/skeleton";

export function MarketsSkeleton() {
  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-1.5 pt-4 pb-3">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
