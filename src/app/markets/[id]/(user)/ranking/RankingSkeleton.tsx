import { Skeleton } from "@/components/ui/skeleton";

export function RankingSkeleton() {
  return (
    <div className="px-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-4 pb-3">
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="flex gap-2 overflow-hidden -mx-4 px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] w-40 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
