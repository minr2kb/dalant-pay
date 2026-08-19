import type { QueryClient } from "@tanstack/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";

type FetchEntry<T = unknown> = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
};

// 쿼리 하나만 프리페치해서 캐시에 채워 넣는다 - 페이지에 쿼리가 하나뿐이면 배열로
// 안 감싸도 되게 hydrateAll과 분리했다.
export async function hydrate(
  qc: QueryClient,
  entry: FetchEntry,
): Promise<QueryClient> {
  qc.setQueryData(entry.queryKey, await entry.queryFn());
  return qc;
}

// 여러 쿼리를 병렬로 프리페치해서 한 번에 채워 넣는다 - queryKey와 queryFn을 한
// 객체로 묶어서, "fetch 배열"과 "queryKey 배열"을 따로 들고 있다가 순서가
// 어긋나는 사고를 원천 차단한다.
export async function hydrateAll(
  qc: QueryClient,
  entries: FetchEntry[],
): Promise<QueryClient> {
  const data = await Promise.all(entries.map((e) => e.queryFn()));
  entries.forEach((e, i) => {
    qc.setQueryData(e.queryKey, data[i]);
  });
  return qc;
}

// 모든 서버 prefetch 페이지가 반복하던 dehydrate(qc) + HydrationBoundary 셸.
export function Hydrated({
  qc,
  children,
}: {
  qc: QueryClient;
  children: ReactNode;
}) {
  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
