import { Calendar, Users } from "lucide-react";
import Link from "next/link";
import { formatKST } from "@/lib/format-date";
import type { Market } from "@/types";

interface MarketCardProps {
  market: Market;
  participantCount: number;
}

export function MarketCard({ market, participantCount }: MarketCardProps) {
  const startDate = formatKST(market.startsAt, {
    month: "long",
    day: "numeric",
  });
  const endDate = formatKST(market.endsAt, { month: "long", day: "numeric" });
  const isEnded = new Date(market.endsAt) < new Date();

  return (
    <div
      className={`rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 ${
        isEnded ? "opacity-60" : ""
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            {market.title}
          </h3>
          {isEnded && (
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              종료됨
            </span>
          )}
        </div>
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
        href={`/markets/${market.id}/home`}
        className="flex w-full items-center justify-center rounded-full py-2.5 text-sm font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
      >
        입장하기
      </Link>
    </div>
  );
}
