import { Skeleton } from "@/components/ui/skeleton";

export function MyPageSkeleton() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-4 pb-3">
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-none" />
        ))}
      </div>
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 rounded-none" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}
