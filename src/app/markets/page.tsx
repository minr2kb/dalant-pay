import { AuthGate } from "@/components/AuthGate";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { canCreateMarket, listMarkets } from "@/lib/data/markets";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MarketsListClient } from "./MarketsListClient";

export default async function MarketsPage() {
  const qc = getQueryClient();
  const userId = await getCurrentUserId();

  // ponytail: 마켓 목록 prefetch와 canCreateMarket 조회는 서로 무관한 별도 쿼리라
  // Promise.all로 동시에 왕복시킨다 - 직렬로 두 번 기다릴 이유가 없다.
  const [, canCreate] = await Promise.all([
    prefetchIfFirstVisit(async () => {
      if (!userId) return;
      const supabase = await createClient();
      await hydrate(qc, {
        queryKey: marketsQuery.list.queryKey(),
        queryFn: () => listMarkets(supabase, userId),
      });
    }),
    userId
      ? createClient().then((supabase) => canCreateMarket(supabase, userId))
      : Promise.resolve(false),
  ]);

  return (
    <Hydrated qc={qc}>
      <AuthGate>
        <MarketsListClient canCreateMarket={canCreate} />
      </AuthGate>
    </Hydrated>
  );
}
