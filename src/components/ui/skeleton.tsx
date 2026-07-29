import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800",
        className,
      )}
    />
  );
}
