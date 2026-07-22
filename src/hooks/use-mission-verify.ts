"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/client";
import { missionsQuery } from "@/lib/query/queries";

type VerifyPrimary = { token: string } | { userId: string; slot?: number };

export function useMissionVerify(
  opts: Parameters<typeof missionsQuery.verify>[0],
) {
  const verifyMutation = useMutation(missionsQuery.verify(opts));
  // Each mutateAsync() call below reassigns the mutation's single internal
  // observer to itself, so verifyMutation.isPending only reflects the LAST
  // dispatched call — wrong once 2+ calls are in flight together. Track our
  // own flag that spans the whole batch instead.
  const [isPending, setIsPending] = useState(false);

  async function verifyGroup(
    marketId: string,
    missionId: string,
    primary: VerifyPrimary,
    extraUserIds: string[] = [],
  ) {
    setIsPending(true);
    try {
      const results = await Promise.allSettled([
        verifyMutation.mutateAsync({ marketId, missionId, ...primary }),
        ...extraUserIds.map((uid) =>
          verifyMutation.mutateAsync({ marketId, missionId, userId: uid }),
        ),
      ]);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const reason = (failed[0] as PromiseRejectedResult).reason;
        const msg = getApiErrorMessage(reason, "인증에 실패했어요");
        toast.error(`${failed.length}명 적립 실패`, { description: msg });
      }
      return results.some((r) => r.status === "fulfilled");
    } finally {
      setIsPending(false);
    }
  }

  return { verifyGroup, isPending };
}
