"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  max = 100,
  warnAt = 0.8,
  dangerAt = 0.95,
  ...props
}: ProgressPrimitive.Root.Props & {
  /** 0~1 사이 비율 - 이 지점부터 주황색으로 경고 표시 */
  warnAt?: number;
  /** 0~1 사이 비율 - 이 지점부터 빨간색으로 경고 표시 */
  dangerAt?: number;
}) {
  const ratio = typeof value === "number" ? value / max : 0;
  const danger = ratio >= dangerAt;
  const warn = !danger && ratio >= warnAt;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative", className)}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/15",
          warn && "bg-amber-500/15",
          danger && "bg-red-500/15",
        )}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-full bg-primary transition-all data-[state=indeterminate]:animate-pulse",
            warn && "bg-amber-500",
            danger && "bg-red-500",
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
