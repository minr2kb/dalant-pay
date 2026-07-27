export function MissionsSkeleton() {
  return (
    <div className="px-4 pb-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4 pb-3">
        <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
