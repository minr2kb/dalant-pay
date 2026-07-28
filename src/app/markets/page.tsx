import { AuthGate } from "@/components/AuthGate";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listMarkets } from "@/lib/data/markets";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MarketsListClient } from "./MarketsListClient";

export default async function MarketsPage() {
  const qc = getQueryClient();
  await prefetchIfFirstVisit(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const supabase = await createClient();
    await hydrate(qc, {
      queryKey: marketsQuery.list.queryKey(),
      queryFn: () => listMarkets(supabase, userId),
    });
  });

  return (
    <Hydrated qc={qc}>
      <AuthGate>
        <MarketsListClient />
      </AuthGate>
    </Hydrated>
  );
}
