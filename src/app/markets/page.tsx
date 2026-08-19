import { AuthGate } from "@/components/AuthGate";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getOwnedMarketUsage, listMarkets } from "@/lib/data/markets";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MarketsListClient } from "./MarketsListClient";

export default async function MarketsPage() {
  const qc = getQueryClient();
  const userId = await getCurrentUserId();

  // ponytail: 마켓 목록 prefetch와 마켓 개수 사용량 조회는 서로 무관한 별도 쿼리라
  // Promise.all로 동시에 왕복시킨다 - 직렬로 두 번 기다릴 이유가 없다.
  const [, usage] = await Promise.all([
    prefetchIfFirstVisit(async () => {
      if (!userId) return;
      const supabase = await createClient();
      await hydrate(qc, {
        queryKey: marketsQuery.list.queryKey(),
        queryFn: () => listMarkets(supabase, userId),
      });
    }),
    userId
      ? createClient()
          .then((supabase) => getOwnedMarketUsage(supabase, userId))
          // 플랜 조회가 실패해도 마켓 목록 페이지 자체는 계속 보여야 한다 -
          // fail-closed로 생성만 막는다(무제한 허용 쪽으로 fail-open하면 안 됨).
          .catch(() => ({ owned: 1, limit: 1 }))
      : Promise.resolve({ owned: 0, limit: null }),
  ]);

  return (
    <Hydrated qc={qc}>
      <AuthGate>
        <MarketsListClient
          canCreateMarket={usage.limit === null || usage.owned < usage.limit}
          marketUsage={usage}
        />
      </AuthGate>
    </Hydrated>
  );
}
