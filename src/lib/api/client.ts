import { createApi, createFetchExecutor } from "@routar/core";
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

const executor = createFetchExecutor(`${BASE_URL}/api`, {
  unwrap: (raw) => (raw as { data: unknown })?.data ?? raw,
});

export const marketsApi = createApi(executor, marketsRouter);
export const participantsApi = createApi(executor, participantsRouter);
export const missionsApi = createApi(executor, missionsRouter);
export const pointLogsApi = createApi(executor, pointLogsRouter);
export const ordersApi = createApi(executor, ordersRouter);
export const itemsApi = createApi(executor, itemsRouter);
export const adminApi = createApi(executor, adminRouter);
export const transferApi = createApi(executor, transferRouter);
