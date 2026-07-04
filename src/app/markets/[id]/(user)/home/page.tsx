import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { getParticipant, joinMarket } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import Loading from "./loading";
import { UserHomeClient } from "./UserHomeClient";

export default async function UserHomePage(
  props: PageProps<"/markets/[id]/home">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createClient();
  await joinMarket(supabase, marketId, userId);

  const qc = getQueryClient();
  const [market, participant] = await Promise.all([
    getMarket(supabase, marketId),
    getParticipant(supabase, marketId, userId),
  ]);
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
  qc.setQueryData(
    participantsQuery.get({ marketId, userId }).queryKey,
    participant,
  );

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Loading />}>
        <UserHomeClient marketId={marketId} userId={userId} />
      </Suspense>
    </HydrationBoundary>
  );
}
