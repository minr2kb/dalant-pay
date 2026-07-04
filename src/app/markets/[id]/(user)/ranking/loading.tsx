export default function Loading() {
  return (
    <div className="px-4 space-y-4 max-w-lg mx-auto">
      <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
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
