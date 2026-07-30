import { createApi } from "@routar/core";
import { executor } from "@/lib/api/executor";
import {
  adminRouter,
  itemsRouter,
  marketsRouter,
  missionsRouter,
  ordersRouter,
  participantsRouter,
  pointLogsRouter,
  pushRouter,
  transferRouter,
} from "@/lib/api/router";

export const marketsApi = createApi(executor, marketsRouter);
export const participantsApi = createApi(executor, participantsRouter);
export const missionsApi = createApi(executor, missionsRouter);
export const pointLogsApi = createApi(executor, pointLogsRouter);
export const ordersApi = createApi(executor, ordersRouter);
export const itemsApi = createApi(executor, itemsRouter);
export const adminApi = createApi(executor, adminRouter);
export const transferApi = createApi(executor, transferRouter);
export const pushApi = createApi(executor, pushRouter);
