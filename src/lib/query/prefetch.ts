import { cookies } from "next/headers";
import { CLIENT_CACHE_COOKIE } from "@/lib/query/persist";

// 서버 prefetch는 "되면 좋고 안 되면 마는" 부가 기능이다 — 실패(마켓 미참여, 네트워크 등)를
// 조용히 삼킨다. 클라이언트가 기존처럼 직접 받아오면 되니까.
export async function prefetchQuietly(
  fill: () => Promise<void>,
): Promise<void> {
  try {
    await fill();
  } catch {
    // 위 이유로 무시.
  }
}

// markets/ranking/mypage가 공유하는 패턴: 캐시 쿠키가 없는(진짜 첫 방문) 브라우저만
// 서버에서 데이터를 실어 보내고, 재방문자는 정적 셸 그대로 클라이언트 캐시에 맡긴다.
export async function prefetchIfFirstVisit(
  fill: () => Promise<void>,
): Promise<void> {
  const hasCache = (await cookies()).get(CLIENT_CACHE_COOKIE)?.value === "1";
  if (!hasCache) await prefetchQuietly(fill);
}
