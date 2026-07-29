import { getQueryClient } from "@/lib/query/get-query-client";
import { createClient } from "@/lib/supabase/client";

// marketsQuery.list()는 유저별로 다른 결과를 반환한다(참여 중인 마켓만). 인메모리
// QueryClient와 IndexedDB에 영속화된 캐시를 여기서 같이 지우지 않으면, 같은 기기에서
// 로그인한 다음 사람이 이전 사람의 마켓 목록을 그대로 이어서 보게 된다.
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  getQueryClient().clear();
  const { clearPersistedQueryCache } = await import(
    "@/lib/query/persist-setup"
  );
  await clearPersistedQueryCache();
}
