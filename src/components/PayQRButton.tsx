"use client";

import { QrCode, Wallet, X } from "lucide-react";
import QRCode from "react-qr-code";
import { Modal } from "@/components/Modal";
import { openModal } from "@/lib/overlay";
import { encodePayQR } from "@/lib/qr";

interface PayQRButtonProps {
  marketId: string;
  userId: string;
  userName: string;
  compact?: boolean;
}

export function PayQRButton({
  marketId,
  userId,
  userName,
  compact = false,
}: PayQRButtonProps) {
  const qrValue = encodePayQR(marketId, userId);

  const handleOpen = () =>
    openModal((close) => (
      <Modal onClose={close}>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">결제용 QR</p>
              <h3 className="font-bold text-gray-900">{userName}</h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-2"
            style={{ colorScheme: "light only" }}
          >
            <QRCode value={qrValue} size={208} />
          </div>

          <p className="text-center text-xs text-gray-400">
            이 QR을 마켓 관리자에게 보여주세요
          </p>
        </div>
      </Modal>
    ));

  return compact ? (
    <button
      type="button"
      onClick={handleOpen}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-transform self-center"
    >
      <QrCode className="h-5 w-5" />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleOpen}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 active:scale-95"
    >
      <Wallet className="h-4 w-4" />
      달란트 사용하기
    </button>
  );
}
