"use client";

import { Copy, Share2, X } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";

export function MarketShareButton({
  marketId,
  marketTitle,
}: {
  marketId: string;
  marketTitle: string;
}) {
  function handleOpen() {
    const shareUrl = `${window.location.origin}/markets/${marketId}`;

    async function handleCopy() {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크가 복사되었어요");
    }

    openModal((close) => (
      <Modal onClose={close}>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                마켓 공유
              </p>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {marketTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-2">
            <QRCode value={shareUrl} size={208} />
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            이 QR을 스캔하면 마켓에 바로 참여할 수 있어요
          </p>

          <Button
            variant="outline"
            className="h-12 w-full gap-2 rounded-2xl border-gray-200 dark:border-gray-700"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            링크 복사
          </Button>
        </div>
      </Modal>
    ));
  }

  return (
    <Button
      variant="outline"
      className="h-12 w-full gap-2 rounded-2xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={handleOpen}
    >
      <Share2 className="h-4 w-4" />
      마켓 공유하기
    </Button>
  );
}
