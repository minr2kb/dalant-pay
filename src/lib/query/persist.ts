import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { createSafeStorage } from "@/lib/query/persist-storage";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";

// 캐시 포맷(쿼리 키 구조, 응답 스키마)이 바뀌면 이 값을 올려서 옛 캐시를 통째로 버린다.
export const CACHE_BUSTER = "v1";

const PERSISTED_QUERY_TAGS = new Set([
  marketsQuery.$key[0],
  participantsQuery.$key[0],
]);

// 지금은 홈 화면(마켓/참여자 쿼리)만 영속화 대상 — 다른 화면까지 캐싱을 넓히면
// 이 Set에 태그를 추가한다. ponytail: 전체 쿼리를 무조건 영속화하지 않는 이유는
// admin 전용 데이터까지 기기에 오래 남는 걸 막기 위함.
export function shouldPersistQuery(query: { queryKey: readonly unknown[] }) {
  return PERSISTED_QUERY_TAGS.has(query.queryKey[0]);
}

export function createHomeCachePersister() {
  return createAsyncStoragePersister({
    storage: createSafeStorage({ get, set, del }),
    key: "dalant-pay-query-cache",
  });
}
