import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AuthGate } from "@/components/AuthGate";
import { getCurrentUserId } from "@/lib/auth";
import { listMarkets } from "@/lib/data/markets";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MarketsListClient } from "./MarketsListClient";

export default async function MarketsPage() {
  const qc = await prefetchIfFirstVisit(async (qc) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const supabase = await createClient();
    const markets = await listMarkets(supabase, userId);
    qc.setQueryData(marketsQuery.list.queryKey(), markets);
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <AuthGate>
        <MarketsListClient />
      </AuthGate>
    </HydrationBoundary>
  );
}
