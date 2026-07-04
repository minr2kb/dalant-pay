export default function Loading() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="space-y-px rounded-2xl overflow-hidden">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}
