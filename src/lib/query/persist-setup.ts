import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { CACHE_BUSTER, shouldPersistQuery } from "@/lib/query/persist";
import { createSafeStorage } from "@/lib/query/persist-storage";

const PERSIST_KEY = "dalant-pay-query-cache";

// idb-keyval + persist-client는 여기서만 임포트된다 - providers.tsx가 마운트 후
// 동적 import로만 이 파일을 불러오므로, 초기 크리티컬 번들에는 안 실린다
// (Slow 3G 재방문에서 이 무게가 그대로 다운로드 시간으로 잡혔던 문제 대응).
export async function setupPersistence(queryClient: QueryClient) {
  const persistOptions = {
    queryClient,
    persister: createAsyncStoragePersister({
      storage: createSafeStorage({ get, set, del }),
      key: PERSIST_KEY,
    }),
    buster: CACHE_BUSTER,
    maxAge: 1000 * 60 * 60 * 24,
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  };

  await persistQueryClientRestore(persistOptions);
  return persistQueryClientSubscribe(persistOptions);
}

// 로그아웃 시 반드시 같이 불러야 한다 - marketsQuery.list()는 유저별로 다른 결과를
// 반환하는데 (참여 중인 마켓만) IndexedDB 캐시는 유저 구분 없이 origin 전체에 하나라,
// 이걸 안 지우면 같은 기기에서 로그인한 다음 사람이 이전 사람의 마켓 목록을 그대로 본다.
export async function clearPersistedQueryCache() {
  try {
    await del(PERSIST_KEY);
  } catch {
    // persist-storage.ts와 동일한 이유 - IndexedDB 차단 환경에서는 지울 것도 없다.
  }
}
