import { createQueries } from "@routar/react-query";
import {
  adminApi,
  itemsApi,
  marketsApi,
  missionsApi,
  ordersApi,
  participantsApi,
  pointLogsApi,
  transferApi,
} from "@/lib/api/apis";

export const marketsQuery = createQueries(marketsApi, { flatten: true });
export const participantsQuery = createQueries(participantsApi, {
  flatten: true,
});
export const missionsQuery = createQueries(missionsApi, { flatten: true });
export const pointLogsQuery = createQueries(pointLogsApi, { flatten: true });
export const ordersQuery = createQueries(ordersApi, { flatten: true });
export const itemsQuery = createQueries(itemsApi, { flatten: true });
export const adminQuery = createQueries(adminApi, { flatten: true });
export const transferQuery = createQueries(transferApi, { flatten: true });
