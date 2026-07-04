import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { listParticipants } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import Loading from "./loading";
import { RankingClient } from "./RankingClient";

export default async function RankingPage(
  props: PageProps<"/markets/[id]/ranking">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const qc = getQueryClient();
  const [market, participants] = await Promise.all([
    getMarket(supabase, marketId),
    listParticipants(supabase, marketId),
  ]);
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, participants);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Loading />}>
        <RankingClient marketId={marketId} userId={userId} />
      </Suspense>
    </HydrationBoundary>
  );
}
