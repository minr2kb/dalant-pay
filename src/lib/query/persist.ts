import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";
import { createSafeStorage } from "@/lib/query/persist-storage";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
} from "@/lib/query/queries";

// 캐시 포맷(쿼리 키 구조, 응답 스키마)이 바뀌면 이 값을 올려서 옛 캐시를 통째로 버린다.
// v2: pending 상태 쿼리까지 저장되던 버그 수정 — 이전에 잘못 저장된 캐시를 폐기.
export const CACHE_BUSTER = "v2";

// 모든 라우터가 prefix "/markets"를 공유해 $key[0]이 항상 "markets"로 겹친다 —
// 태그만으로는 구분이 안 되므로 (root + path 템플릿) 전체를 접두어로 비교한다.
// 유저 화면(홈/미션목록/랭킹/히스토리/마이페이지)에 필요한 쿼리만 영속화 대상.
// participantsQuery.list(전체 참여자 명단)는 랭킹 화면에서만 의도적으로 포함 —
// 랭킹은 원래 온라인 상태에서도 모두의 잔액을 보여주는 화면이라 캐싱한다고 새로
// 노출되는 정보가 없다. admin 전용 화면 쿼리는 여기 없음 — 기기에 관리자용 데이터가
// 오래 남는 걸 막기 위해 의도적으로 제외.
const PERSISTED_KEY_PREFIXES = [
  marketsQuery.get.queryKey(),
  participantsQuery.get.queryKey(),
  participantsQuery.list.queryKey(),
  missionsQuery.list.queryKey(),
] as const;

export function shouldPersistQuery(query: Query) {
  // pending 상태(아직 안 끝난 fetch)를 저장하면, 나중에 복원할 때 그 Promise를
  // 실제로 이어받을 방법이 없어 "dehydrated as pending... CancelledError"로
  // 터진다 — success로 끝난 쿼리만 저장한다.
  if (query.state.status !== "success") return false;
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
