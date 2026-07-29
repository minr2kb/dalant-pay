import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="pt-4 pb-3">
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-[172px] rounded-2xl" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
