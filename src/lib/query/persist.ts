import type { Query } from "@tanstack/react-query";
import {
  marketsQuery,
  missionsQuery,
  participantsQuery,
} from "@/lib/query/queries";

// 캐시 포맷(쿼리 키 구조, 응답 스키마)이 바뀌면 이 값을 올려서 옛 캐시를 통째로 버린다.
// v3: marketsQuery.list(마켓 목록 + 참여 여부) 추가 - /markets가 PWA start_url 계열
// 진입점이라 이것도 캐시 우선으로 전환.
export const CACHE_BUSTER = "v3";

// 서버 컴포넌트가 "이 브라우저는 캐시가 있을 가능성이 높다"를 쿠키만 보고 판단하기 위한 값
// (IndexedDB는 서버에서 못 읽으니까). Providers가 마운트될 때마다 세팅 - 실제 캐시 유무를
// 정확히 추적하진 않지만, 재방문자를 걸러내는 용도로는 충분하다.
export const CLIENT_CACHE_COOKIE = "dp-cached";

// 모든 라우터가 prefix "/markets"를 공유해 $key[0]이 항상 "markets"로 겹친다 -
// 태그만으로는 구분이 안 되므로 (root + path 템플릿) 전체를 접두어로 비교한다.
// 유저 화면(마켓목록/홈/미션목록/랭킹/히스토리/마이페이지)에 필요한 쿼리만 영속화 대상.
// participantsQuery.list(전체 참여자 명단)는 랭킹 화면에서만 의도적으로 포함 -
// 랭킹은 원래 온라인 상태에서도 모두의 잔액을 보여주는 화면이라 캐싱한다고 새로
// 노출되는 정보가 없다. admin 전용 화면 쿼리는 여기 없음 - 기기에 관리자용 데이터가
// 오래 남는 걸 막기 위해 의도적으로 제외.
const PERSISTED_KEY_PREFIXES = [
  marketsQuery.get.queryKey(),
  marketsQuery.list.queryKey(),
  participantsQuery.get.queryKey(),
  participantsQuery.list.queryKey(),
  missionsQuery.list.queryKey(),
] as const;

export function shouldPersistQuery(query: Query) {
  // pending 상태(아직 안 끝난 fetch)를 저장하면, 나중에 복원할 때 그 Promise를
  // 실제로 이어받을 방법이 없어 "dehydrated as pending... CancelledError"로
  // 터진다 - success로 끝난 쿼리만 저장한다.
  if (query.state.status !== "success") return false;
  return PERSISTED_KEY_PREFIXES.some((prefix) =>
    prefix.every((segment, i) => query.queryKey[i] === segment),
  );
}
