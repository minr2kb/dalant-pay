import { getCurrentUserId } from "@/lib/auth/current-user";
import { getMarket } from "@/lib/data/markets";
import { getParticipant } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrateAll } from "@/lib/query/hydrate";
import { prefetchIfFirstVisit } from "@/lib/query/prefetch";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { MyPageClient } from "./MyPageClient";

export default async function MyPage(props: PageProps<"/markets/[id]/mypage">) {
  const { id: marketId } = await props.params;
  // 캐시 여부와 무관하게 필요 - MyPageClient가 첫 렌더부터 SSR 검증된 userId로
  // 쿼리 키를 맞추기 위함 (useSessionUserId()의 비동기 확인을 기다리지 않도록).
  const userId = await getCurrentUserId();

  const qc = getQueryClient();
  await prefetchIfFirstVisit(async () => {
    if (!userId) return;
    const supabase = await createClient();
    await hydrateAll(qc, [
      {
        queryKey: marketsQuery.get({ marketId }).queryKey,
        queryFn: () => getMarket(supabase, marketId),
      },
      {
        queryKey: participantsQuery.get({ marketId, userId }).queryKey,
        queryFn: () => getParticipant(supabase, marketId, userId),
      },
    ]);
  });

  return (
    <Hydrated qc={qc}>
      <MyPageClient marketId={marketId} initialUserId={userId} />
    </Hydrated>
  );
}
