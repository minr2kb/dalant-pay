import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { CACHE_BUSTER, shouldPersistQuery } from "@/lib/query/persist";
import { createSafeStorage } from "@/lib/query/persist-storage";

// idb-keyval + persist-client는 여기서만 임포트된다 — providers.tsx가 마운트 후
// 동적 import로만 이 파일을 불러오므로, 초기 크리티컬 번들에는 안 실린다
// (Slow 3G 재방문에서 이 무게가 그대로 다운로드 시간으로 잡혔던 문제 대응).
export async function setupPersistence(queryClient: QueryClient) {
  const persistOptions = {
    queryClient,
    persister: createAsyncStoragePersister({
      storage: createSafeStorage({ get, set, del }),
      key: "dalant-pay-query-cache",
    }),
    buster: CACHE_BUSTER,
    maxAge: 1000 * 60 * 60 * 24,
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  };

  await persistQueryClientRestore(persistOptions);
  return persistQueryClientSubscribe(persistOptions);
}
