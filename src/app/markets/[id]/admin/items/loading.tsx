export default function Loading() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="pt-4 pb-3">
        <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-[172px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[60px] animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
