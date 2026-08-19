"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSessionUserId } from "@/components/AuthGate";
import { MarketCard } from "@/components/market/MarketCard";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { Progress } from "@/components/ui/progress";
import { signOut } from "@/lib/auth/sign-out";
import { openModal } from "@/lib/overlay";
import { marketsQuery } from "@/lib/query/queries";
import { JoinByCodeModal } from "./JoinByCodeModal";
import { MarketsSkeleton } from "./MarketsSkeleton";

export function MarketsListClient({
  canCreateMarket,
  marketUsage,
}: {
  canCreateMarket: boolean;
  marketUsage: { owned: number; limit: number | null };
}) {
  const userId = useSessionUserId();
  const router = useRouter();

  const { data: items } = useQuery({
    ...marketsQuery.list(),
    enabled: !!userId,
  });

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  function handleCreateBlocked() {
    toast.error("마켓 개수 한도에 도달했어요");
    openModal((close) => (
      <UpgradeModal reason="마켓 개수 한도에 도달했어요" onClose={close} />
    ));
  }

  if (!items) return <MarketsSkeleton />;

  const marketRatio =
    marketUsage.limit !== null ? marketUsage.owned / marketUsage.limit : 0;

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

        {marketUsage.limit !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>내 마켓 개수</span>
              <span>
                {marketUsage.owned} / {marketUsage.limit}
              </span>
            </div>
            <Progress
              value={Math.min(marketUsage.owned, marketUsage.limit)}
              max={marketUsage.limit}
            />
            {marketRatio >= 0.8 && (
              <button
                type="button"
                onClick={() =>
                  openModal((close) => (
                    <UpgradeModal
                      reason="마켓 개수 한도에 거의 다 찼어요"
                      onClose={close}
                    />
                  ))
                }
                className={`text-xs font-medium underline ${
                  marketRatio >= 0.95
                    ? "text-red-500"
                    : "text-amber-500 dark:text-amber-400"
                }`}
              >
                {marketRatio >= 0.95
                  ? "마켓 개수가 거의 다 찼어요 - 업그레이드하기"
                  : "마켓 개수 한도가 얼마 안 남았어요 - 업그레이드하기"}
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {canCreateMarket ? (
            <Link
              href="/markets/new"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <Plus className="h-4 w-4" />
              마켓 만들기
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleCreateBlocked}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-400 dark:text-gray-600"
            >
              <Plus className="h-4 w-4" />
              마켓 만들기
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              openModal((close) => <JoinByCodeModal onClose={close} />)
            }
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <KeyRound className="h-4 w-4" />
            코드로 참여하기
          </button>
        </div>

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
