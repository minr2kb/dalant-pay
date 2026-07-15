import type { QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getQueryClient } from "@/lib/query/get-query-client";
import { CLIENT_CACHE_COOKIE } from "@/lib/query/persist";

// markets/ranking/mypage가 공유하는 패턴: 캐시 쿠키가 없는(진짜 첫 방문) 브라우저만
// 서버에서 데이터를 실어 보내고, 재방문자는 정적 셸 그대로 클라이언트 캐시에 맡긴다.
// 조회 실패도 여기서 삼킨다 — 클라이언트가 기존처럼 직접 받아오면 되니까.
export async function prefetchIfFirstVisit(
  fill: (qc: QueryClient) => Promise<void>,
) {
  const qc = getQueryClient();
  const hasCache = (await cookies()).get(CLIENT_CACHE_COOKIE)?.value === "1";
  if (!hasCache) {
    try {
      await fill(qc);
    } catch {
      // 조회 실패해도 클라이언트가 기존처럼 직접 받아온다.
    }
  }
  return qc;
}
