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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
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

export const marketsApi = createApi(executor, marketsRouter);
export const participantsApi = createApi(executor, participantsRouter);
export const missionsApi = createApi(executor, missionsRouter);
export const pointLogsApi = createApi(executor, pointLogsRouter);
export const ordersApi = createApi(executor, ordersRouter);
export const itemsApi = createApi(executor, itemsRouter);
export const adminApi = createApi(executor, adminRouter);
export const transferApi = createApi(executor, transferRouter);
