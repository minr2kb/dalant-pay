import { HttpError, TimeoutError } from "@routar/core";
import { routarQueryClient } from "@routar/react-query";
import {
  isServer,
  MutationCache,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { cache } from "react";
import { toast } from "sonner";

// mutation이 실패했을 때 "네트워크 문제라서 아예 안 됐다"를 한 곳에서 안내한다.
// HttpError(서버가 실제로 응답한 에러, 예: "이미 완료한 미션이에요")는 각 mutation의
// 개별 onError가 이미 자기 메시지를 보여주고 있으니 여기서는 건드리지 않는다.
function notifyMutationNetworkError(error: unknown) {
  if (typeof window === "undefined") return;
  if (error instanceof HttpError) return;
  if (error instanceof TimeoutError) {
    toast.error("네트워크가 느려요", {
      description: "요청이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요",
    });
    return;
  }
  toast.error("인터넷 연결을 확인해주세요", {
    description: "오프라인 상태에서는 이 기능을 사용할 수 없어요",
  });
}

export function makeQueryClient() {
  // routarQueryClient() would wire routarMutationCache() itself, but only if we
  // don't pass our own mutationCache — since we need onError for the network
  // toast above, we replicate its onSuccess invalidation here in the same cache.
  let queryClient: QueryClient;
  queryClient = routarQueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
    mutationCache: new MutationCache({
      onError: notifyMutationNetworkError,
      onSuccess: (_data, _vars, _context, mutation) => {
        const invalidates = mutation.meta?.invalidates as QueryKey[] | undefined;
        if (!invalidates?.length) return;
        for (const queryKey of invalidates) {
          queryClient.invalidateQueries({ queryKey });
        }
      },
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
