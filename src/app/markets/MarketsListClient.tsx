"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionUserId } from "@/components/AuthGate";
import { MarketCard } from "@/components/market/MarketCard";
import { marketsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/client";
import { MarketsSkeleton } from "./MarketsSkeleton";

export function MarketsListClient({
  canCreateMarket,
}: {
  canCreateMarket: boolean;
}) {
  const userId = useSessionUserId();
  const router = useRouter();

  const { data: items } = useQuery({
    ...marketsQuery.list(),
    enabled: !!userId,
  });

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!items) return <MarketsSkeleton />;

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="sticky-header flex items-start justify-between pt-2 pb-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              마켓
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              참여 중인 마켓이에요
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="로그아웃"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {canCreateMarket && (
          <Link
            href="/markets/new"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            <Plus className="h-4 w-4" />
            마켓 추가
          </Link>
        )}

        {items.length > 0 ? (
          <section className="space-y-3">
            {items.map(({ market, participantCount }) => (
              <MarketCard
                key={market.id}
                market={market}
                participantCount={participantCount}
              />
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              참여 중인 마켓이 없어요
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              QR 코드를 스캔해서 참여할 수 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
