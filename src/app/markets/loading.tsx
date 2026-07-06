export default function Loading() {
  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
