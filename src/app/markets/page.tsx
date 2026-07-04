import { MarketCard } from "@/components/MarketCard";
import { mapMarket } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  const [{ data: markets }, { data: myParticipations }] = await Promise.all([
    supabase
      .from("markets")
      .select("*, market_participants(count)")
      .order("created_at", { ascending: false }),
    userId
      ? supabase
          .from("market_participants")
          .select("market_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] }),
  ]);

  const joinedIds = new Set((myParticipations ?? []).map((p) => p.market_id));

  type RawMarket = NonNullable<typeof markets>[number];

  function getCount(m: RawMarket) {
    const c = m.market_participants as unknown as { count: number }[];
    return c?.[0]?.count ?? 0;
  }

  const allMapped = (markets ?? []).map((m) => ({
    market: mapMarket(m as Record<string, unknown>),
    count: getCount(m),
  }));
  const joined = allMapped.filter((m) => joinedIds.has(m.market.id));
  const available = allMapped.filter((m) => !joinedIds.has(m.market.id));

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            마켓
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            참여 가능한 행사를 선택하세요
          </p>
        </div>

        {joined.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              참여 중인 마켓
            </h2>
            {joined.map(({ market, count }) => (
              <MarketCard
                key={market.id}
                market={market}
                participantCount={count}
                isJoined
              />
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            참여 가능한 마켓
          </h2>
          {available.length > 0 ? (
            available.map(({ market, count }) => (
              <MarketCard
                key={market.id}
                market={market}
                participantCount={count}
                isJoined={false}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                다른 활성 마켓이 없어요
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                QR 코드를 스캔해서 참여할 수 있어요
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
