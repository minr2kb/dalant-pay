import { createApi, createFetchExecutor, definePlugin } from "@routar/core";
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

// 브라우저가 오프라인인 걸 이미 알고 있으면 요청 자체를 보내지 않고 바로 실패시킨다
// (서버에선 navigator가 없으니 항상 통과). 애매한 경우(연결된 것 같은데 응답이 안 옴)는
// 아래 timeout이 대신 잡는다 — 이 두 에러는 makeQueryClient의 전역 mutationCache가
// HttpError(실제 응답 온 에러)와 구분해서 토스트로 안내한다.
const offlineGuardPlugin = definePlugin({
  onRequest: (opts) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("Offline");
    }
    return opts;
  },
});

const executor = createFetchExecutor(`${BASE_URL}/api`, {
  unwrap: (raw) => (raw as { data: unknown })?.data ?? raw,
  plugins: [offlineGuardPlugin],
  timeout: 10_000,
});

export const marketsApi = createApi(executor, marketsRouter);
export const participantsApi = createApi(executor, participantsRouter);
export const missionsApi = createApi(executor, missionsRouter);
export const pointLogsApi = createApi(executor, pointLogsRouter);
export const ordersApi = createApi(executor, ordersRouter);
export const itemsApi = createApi(executor, itemsRouter);
export const adminApi = createApi(executor, adminRouter);
export const transferApi = createApi(executor, transferRouter);
