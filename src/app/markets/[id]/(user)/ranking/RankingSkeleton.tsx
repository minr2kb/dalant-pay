export function RankingSkeleton() {
  return (
    <div className="px-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-4 pb-3">
        <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="flex gap-2 overflow-hidden -mx-4 px-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] w-40 shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
