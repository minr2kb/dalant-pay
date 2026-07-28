import { HttpError, TimeoutError, ValidationError } from "@routar/core";
import { routarMutationCache, routarQueryClient } from "@routar/react-query";
import { isServer, type QueryClient } from "@tanstack/react-query";
import { cache } from "react";
import { toast } from "sonner";
import { OfflineError } from "@/lib/api/executor";

// mutation이 실패했을 때 원인별로 다른 안내를 한 곳에서 낸다. HttpError(서버가 실제로
// 응답한 에러, 예: "이미 완료한 미션이에요")는 각 mutation의 개별 onError가 이미 자기
// 메시지를 보여주고 있으니 여기서는 건드리지 않는다.
//
// 나머지(OfflineError/TimeoutError 이외)를 전부 "인터넷 연결을 확인해주세요"로
// 뭉뚱그리면 안 된다 — 실제로 ValidationError(응답이 zod 스키마와 안 맞음, 서버 버그)가
// 이 케이스로 잘못 분류되어 정상 응답인데도 오프라인 토스트가 뜬 적이 있었다.
function notifyMutationNetworkError(error: unknown) {
  if (typeof window === "undefined") return;
  if (error instanceof HttpError) return;
  if (error instanceof TimeoutError) {
    toast.error("네트워크가 느려요", {
      description: "요청이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요",
    });
    return;
  }
  if (error instanceof OfflineError) {
    toast.error("인터넷 연결을 확인해주세요", {
      description: "오프라인 상태에서는 이 기능을 사용할 수 없어요",
    });
    return;
  }
  if (error instanceof ValidationError) {
    console.error("[mutation] response validation failed", error);
    toast.error("일시적인 오류가 발생했어요", {
      description: "잠시 후 다시 시도해주세요",
    });
    return;
  }
  console.error("[mutation] unexpected error", error);
  toast.error("문제가 발생했어요", {
    description: "잠시 후 다시 시도해주세요",
  });
}

export function makeQueryClient() {
  // routarMutationCache's overrides merge in onError while keeping its own
  // onSuccess invalidation logic, so this both wires up the toast and marks
  // the cache as "wired" (silencing @routar/react-query's unwired-invalidates warning).
  let queryClient: QueryClient;
  queryClient = routarQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
    mutationCache: routarMutationCache(() => queryClient, {
      onError: notifyMutationNetworkError,
    }),
  });
  return queryClient;
}

let browserQC: ReturnType<typeof makeQueryClient> | undefined;

const getServerQueryClient = cache(makeQueryClient);

export function getQueryClient() {
  if (isServer) return getServerQueryClient();
  // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic lazy-init memoized singleton — creates browserQC once per browser session and reuses it on subsequent calls
  return (browserQC ??= makeQueryClient());
}
