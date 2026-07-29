import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between pt-4 pb-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
