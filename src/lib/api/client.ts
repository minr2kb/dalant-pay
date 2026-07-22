import {
  createApi,
  createFetchExecutor,
  definePlugin,
  HttpError,
} from "@routar/core";
import {
  adminRouter,
  itemsRouter,
  marketsRouter,
  missionsRouter,
  ordersRouter,
  participantsRouter,
  pointLogsRouter,
  transferRouter,
} from "./router";

const BASE_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    : window.location.origin;

// 별도 클래스로 던져야 makeQueryClient의 mutationCache가 "진짜 오프라인"과
// 다른 실패(ValidationError 등)를 구분해서 토스트를 낼 수 있다 — 예전에 generic
// Error("Offline")로 던졌을 때는 그 구분이 안 돼서 무관한 실패까지 전부
// "인터넷 연결을 확인해주세요"로 뭉뚱그려졌었다.
export class OfflineError extends Error {
  constructor() {
    super("Offline");
    this.name = "OfflineError";
  }
}

const offlineGuardPlugin = definePlugin({
  onRequest: (opts) => {
    // Node 22+ defines a partial global `navigator` (just userAgent) with no
    // `.onLine`, so this must also confirm we're in a browser before trusting
    // it — otherwise every SSR request reads `!undefined` as offline.
    if (typeof window !== "undefined" && !navigator.onLine) {
      throw new OfflineError();
    }
    return opts;
  },
});

const executor = createFetchExecutor(`${BASE_URL}/api`, {
  unwrap: (raw) => (raw as { data: unknown })?.data ?? raw,
  plugins: [offlineGuardPlugin],
  timeout: 10_000,
});

// 서버는 실패 시 항상 { error: string } 봉투로 응답한다(src/lib/api/route-helpers.ts의
// err() 참고) — HttpError.body는 라이브러리에서 unknown으로 열려있으니, 호출부마다
// `as any`로 뚫는 대신 여기서 한 번만 좁혀서 재사용한다.
function hasErrorField(body: unknown): body is { error: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "string"
  );
}

export function getApiErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof HttpError && hasErrorField(e.body)) return e.body.error;
  return fallback;
}

export const marketsApi = createApi(executor, marketsRouter);
export const participantsApi = createApi(executor, participantsRouter);
export const missionsApi = createApi(executor, missionsRouter);
export const pointLogsApi = createApi(executor, pointLogsRouter);
export const ordersApi = createApi(executor, ordersRouter);
export const itemsApi = createApi(executor, itemsRouter);
export const adminApi = createApi(executor, adminRouter);
export const transferApi = createApi(executor, transferRouter);
