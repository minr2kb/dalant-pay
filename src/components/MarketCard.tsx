import { Calendar, Users } from "lucide-react";
import Link from "next/link";
import { formatKST } from "@/lib/format-date";
import type { Market } from "@/types";

interface MarketCardProps {
  market: Market;
  participantCount: number;
  isJoined: boolean;
}

export function MarketCard({
  market,
  participantCount,
  isJoined,
}: MarketCardProps) {
  const startDate = formatKST(market.startsAt, { month: "long", day: "numeric" });
  const endDate = formatKST(market.endsAt, { month: "long", day: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">
          {market.title}
        </h3>
        {market.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {market.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {startDate} ~ {endDate}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {participantCount}명
        </span>
      </div>
      <Link
        href={isJoined ? `/markets/${market.id}/home` : `/markets/${market.id}`}
        className={`flex w-full items-center justify-center rounded-full py-2.5 text-sm font-medium transition-colors ${
          isJoined
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
        }`}
      >
        {isJoined ? "입장하기" : "참여하기"}
      </Link>
    </div>
  );
}
