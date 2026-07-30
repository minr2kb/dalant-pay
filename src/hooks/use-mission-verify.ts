"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { missionsApi } from "@/lib/api/apis";
import { getApiErrorMessage } from "@/lib/api/executor";

type VerifyPrimary = { token: string } | { userId: string; slot?: number };

// 그룹 미션은 대상자마다 다른 idempotency key가 필요한데(같은 키를 공유하면 한 명의
// 캐시된 응답이 다른 명한테 재생됨), react-query 뮤테이션 훅의 headers는 훅 인스턴스
// 하나에 고정이라 mutateAsync 호출마다 못 바꾼다 — 그래서 여기만 raw api 클라이언트로
// 호출해 대상자별 진짜 per-call 헤더를 쓴다. 캐시 무효화도 그만큼 직접 처리한다.
export function useMissionVerify(opts: { invalidates: QueryKey[] }) {
  const queryClient = useQueryClient();
  // Promise.allSettled로 여러 요청이 동시에 나가므로 react-query의 단일 뮤테이션
  // isPending으로는 배치 전체 상태를 못 잡는다 — 우리가 직접 배치 전체를 감싼다.
  const [isPending, setIsPending] = useState(false);
  // 이 훅 인스턴스(= 확인 모달 하나) 수명 동안 고정 — 재시도가 같은 키를 재사용해
  // 서버가 award_mission을 다시 안 태우고 첫 실행 결과를 그대로 돌려주게 한다.
  // 그룹 미션은 대상자별로 파생 키를 써서 한 명 실패가 다른 명 재시도를 안 막는다.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  async function verifyGroup(
    marketId: string,
    missionId: string,
    primary: VerifyPrimary,
    extraUserIds: string[] = [],
    reward?: number,
  ) {
    setIsPending(true);
    try {
      const call = (body: Record<string, unknown>, key: string) =>
        missionsApi.verify(
          { path: { marketId, missionId }, body: { reward, ...body } },
          { headers: { "Idempotency-Key": key } },
        );

      const results = await Promise.allSettled([
        call(primary, `${idempotencyKey}:primary`),
        ...extraUserIds.map((uid) =>
          call({ userId: uid }, `${idempotencyKey}:${uid}`),
        ),
      ]);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const reason = (failed[0] as PromiseRejectedResult).reason;
        const msg = getApiErrorMessage(reason, "인증에 실패했어요");
        toast.error(`${failed.length}명 적립 실패`, { description: msg });
      }
      for (const key of opts.invalidates) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      return results.some((r) => r.status === "fulfilled");
    } finally {
      setIsPending(false);
    }
  }

  return { verifyGroup, isPending };
}
