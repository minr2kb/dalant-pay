export default function Loading() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between pt-4 pb-3">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
