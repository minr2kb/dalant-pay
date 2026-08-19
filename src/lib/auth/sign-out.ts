import { getQueryClient } from "@/lib/query/get-query-client";
import { createClient } from "@/lib/supabase/client";

// marketsQuery.list()는 유저별로 다른 결과를 반환한다(참여 중인 마켓만). 인메모리
// QueryClient와 IndexedDB에 영속화된 캐시를 여기서 같이 지우지 않으면, 같은 기기에서
// 로그인한 다음 사람이 이전 사람의 마켓 목록을 그대로 이어서 보게 된다.
export async function signOut() {
  const supabase = createClient();
  // scope: "local"은 서버 세션 무효화 요청 없이 로컬 세션만 즉시 지운다 -
  // 기본 scope("global")는 네트워크 왕복을 기다리는데, 이게 느리거나 실패하면
  // 로그아웃 버튼을 눌러도 다음 단계(캐시 초기화, /login 이동)가 멈춰버린다.
  await supabase.auth.signOut({ scope: "local" });
  getQueryClient().clear();
  const { clearPersistedQueryCache } = await import(
    "@/lib/query/persist-setup"
  );
  await clearPersistedQueryCache();
}
