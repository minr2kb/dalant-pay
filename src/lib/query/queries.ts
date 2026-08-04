import { createQueries } from "@routar/react-query";
import {
  adminApi,
  groupsApi,
  itemsApi,
  marketsApi,
  missionsApi,
  ordersApi,
  participantsApi,
  pointLogsApi,
  pushApi,
  transferApi,
} from "@/lib/api/apis";

export const marketsQuery = createQueries(marketsApi, { flatten: true });
export const participantsQuery = createQueries(participantsApi, {
  flatten: true,
});
export const groupsQuery = createQueries(groupsApi, { flatten: true });
export const missionsQuery = createQueries(missionsApi, { flatten: true });

export const POINT_LOGS_PAGE_SIZE = 20;
export const pointLogsQuery = createQueries(pointLogsApi, {
  flatten: true,
  infinite: {
    list: {
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === POINT_LOGS_PAGE_SIZE ? allPages.length : undefined,
      pageParam: (page) => ({
        query: { page, pageSize: POINT_LOGS_PAGE_SIZE },
      }),
    },
  },
});
export const ordersQuery = createQueries(ordersApi, { flatten: true });
export const itemsQuery = createQueries(itemsApi, { flatten: true });
export const adminQuery = createQueries(adminApi, { flatten: true });
export const transferQuery = createQueries(transferApi, { flatten: true });
export const pushQuery = createQueries(pushApi, { flatten: true });
