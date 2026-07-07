import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { createSafeStorage } from "@/lib/query/persist-storage";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";

// 캐시 포맷(쿼리 키 구조, 응답 스키마)이 바뀌면 이 값을 올려서 옛 캐시를 통째로 버린다.
export const CACHE_BUSTER = "v1";

// 모든 라우터가 prefix "/markets"를 공유해 $key[0]이 항상 "markets"로 겹친다 —
// 태그만으로는 구분이 안 되므로 (root + path 템플릿) 전체를 접두어로 비교한다.
// 지금은 홈 화면에 필요한 마켓 정보 + 본인 프로필만 영속화 대상.
// ponytail: 전체 쿼리를 무조건 영속화하지 않는 이유는 admin 전용 데이터(전체 참여자
// 명단 등)까지 기기에 오래 남는 걸 막기 위함 — 새 화면을 추가하려면 이 배열에
// 추가한다.
const PERSISTED_KEY_PREFIXES = [
  marketsQuery.get.queryKey(),
  participantsQuery.get.queryKey(),
] as const;

export function shouldPersistQuery(query: { queryKey: readonly unknown[] }) {
  return PERSISTED_KEY_PREFIXES.some((prefix) =>
    prefix.every((segment, i) => query.queryKey[i] === segment),
  );
}

export function createHomeCachePersister() {
  return createAsyncStoragePersister({
    storage: createSafeStorage({ get, set, del }),
    key: "dalant-pay-query-cache",
  });
}
