import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import { getMarket } from "@/lib/data/markets";
import { getParticipant } from "@/lib/data/participants";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MyPageClient } from "./MyPageClient";

export default async function MyPage(props: PageProps<"/markets/[id]/mypage">) {
  const { id: marketId } = await props.params;
  // 캐시 여부와 무관하게 필요 — MyPageClient가 첫 렌더부터 SSR 검증된 userId로
  // 쿼리 키를 맞추기 위함 (useSessionUserId()의 비동기 확인을 기다리지 않도록).
  const userId = await getCurrentUserId();

  const qc = await prefetchIfFirstVisit(async (qc) => {
    if (!userId) return;
    const supabase = await createClient();
    const [market, participants] = await Promise.all([
      getMarket(supabase, marketId),
      getParticipant(supabase, marketId, userId),
    ]);
    qc.setQueryData(marketsQuery.get({ marketId }).queryKey, market);
    qc.setQueryData(
      participantsQuery.get({ marketId, userId }).queryKey,
      participants,
    );
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <MyPageClient marketId={marketId} initialUserId={userId} />
    </HydrationBoundary>
  );
}
