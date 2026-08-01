"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/executor";
import { marketsQuery } from "@/lib/query/queries";

export function DeleteMarketModal({
  marketId,
  marketTitle,
  onClose,
}: {
  marketId: string;
  marketTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === marketTitle;

  const { mutate: deleteMarket, isPending } = useMutation(
    marketsQuery.delete({
      invalidates: [marketsQuery.$key],
      onSuccess: () => {
        toast.success("마켓을 삭제했어요");
        onClose();
        router.push("/markets");
      },
      onError: (e) => toast.error(getApiErrorMessage(e, "삭제에 실패했어요")),
    }),
  );

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5 text-gray-900 dark:text-white">
        <div className="space-y-1.5">
          <h3 className="font-bold text-rose-600 dark:text-rose-400">
            마켓을 완전 삭제할까요?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            삭제하면 미션 인증·구매·전송·지급이 모두 즉시 막히고 마켓이 목록에서
            완전히 사라져요. 참가자·거래 기록은 DB에 남지만, 이 작업은 되돌릴 수
            없어요.
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            확인을 위해 마켓 이름{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {marketTitle}
            </span>
            을 입력하세요
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={marketTitle}
            disabled={isPending}
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            className="h-12 flex-1 bg-rose-500 hover:bg-rose-600"
            onClick={() => deleteMarket({ marketId })}
            disabled={!canDelete || isPending}
          >
            {isPending ? "삭제 중…" : "완전 삭제"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
