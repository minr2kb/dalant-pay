export default function Loading() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
