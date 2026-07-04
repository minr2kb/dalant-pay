import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { getParticipant } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import Loading from "./loading";
import { MyPageClient } from "./MyPageClient";

export default async function MyPage(props: PageProps<"/markets/[id]/mypage">) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const qc = getQueryClient();
  const [market, participants] = await Promise.all([
    getMarket(supabase, marketId),
    getParticipant(supabase, marketId, userId),
  ]);
  qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
  qc.setQueryData(
    participantsQuery.get({ marketId, userId }).queryKey,
    participants,
  );

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <Suspense fallback={<Loading />}>
        <MyPageClient marketId={marketId} userId={userId} />
      </Suspense>
    </HydrationBoundary>
  );
}
