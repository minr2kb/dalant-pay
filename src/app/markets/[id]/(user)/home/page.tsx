import { getCurrentUserId } from "@/lib/auth/current-user";
import { getMarket } from "@/lib/data/markets";
import { getParticipant } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrateAll } from "@/lib/query/hydrate";
import { prefetchQuietly } from "@/lib/query/prefetch";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { UserHomeClient } from "./UserHomeClient";

// cold 방문(스킵된 서버 prefetch 탓에 클라이언트가 데이터를 별도 왕복으로 받아오던 것)이
// 느린 네트워크에서 크게 불리했다 - userId를 getClaims()로 로컬 검증만 하고(네트워크 없음),
// 있으면 서버에서 한 번에 데이터까지 실어 보낸다. 세션이 없거나 조회 실패하면 조용히
// 빈 셸만 반환 - AuthGate가 클라이언트에서 낙관적 렌더링/재검증을 그대로 이어받는다.
export default async function UserHomePage(
  props: PageProps<"/markets/[id]/home">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  const qc = getQueryClient();

  if (userId) {
    const supabase = await createClient();
    await prefetchQuietly(async () => {
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
  }

  return (
    <Hydrated qc={qc}>
      <UserHomeClient marketId={marketId} initialUserId={userId} />
    </Hydrated>
  );
}
