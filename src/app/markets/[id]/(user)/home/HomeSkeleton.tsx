export function HomeSkeleton() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-36 animate-pulse rounded-3xl bg-emerald-100 dark:bg-emerald-900/30" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
