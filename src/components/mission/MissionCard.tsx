import { CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatReward, type Mission } from "@/types";

interface MissionCardProps {
  mission: Mission;
  marketId: string;
}

function getMissionStatus(
  mission: Mission,
): "completed" | "partial" | "pending" {
  if (!mission.slots) return "pending";
  const completed = mission.slots.filter((s) => s.verifiedAt !== null).length;
  if (completed === 0) return "pending";
  if (mission.limitCount === null) return "partial"; // 무제한은 계속 진행중 상태 유지
  if (completed === mission.limitCount) return "completed";
  return "partial";
}

export function MissionCard({ mission, marketId }: MissionCardProps) {
  const status = getMissionStatus(mission);
  const completedCount =
    mission.slots?.filter((s) => s.verifiedAt !== null).length ?? 0;

  return (
    <Link href={`/markets/${marketId}/missions/${mission.id}`}>
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2.5 active:scale-[0.99] transition-transform">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                {mission.title}
              </span>
              {mission.isGroup && (
                <span className="shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
                  단체
                </span>
              )}
            </div>
            {mission.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                {mission.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-bold tabular-nums text-emerald-500">
              +{formatReward(mission)}
            </span>
            {status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : status === "partial" ? (
              <Clock className="h-4 w-4 text-amber-400" />
            ) : (
              <Circle className="h-4 w-4 text-gray-200 dark:text-gray-700" />
            )}
          </div>
        </div>

        {mission.limitCount != null &&
          mission.limitCount > 1 &&
          mission.slots && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {mission.slots.map((slot) => (
                  <div
                    key={slot.slot}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      slot.verifiedAt
                        ? "bg-emerald-400"
                        : "bg-gray-100 dark:bg-gray-700",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                {completedCount}/{mission.limitCount}
              </span>
            </div>
          )}

        {mission.limitCount === null && completedCount > 0 && (
          <div className="flex items-center justify-end">
            <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
              {completedCount}회 인증
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
