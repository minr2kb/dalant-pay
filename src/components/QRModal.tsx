"use client";

import { QrCode, X } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useInterval } from "@/hooks/use-interval";
import { openModal } from "@/lib/overlay";

interface QRModalProps {
  marketId: string;
  missionId: string;
  userId: string;
  missionTitle: string;
  hint?: string;
  disabled?: boolean;
  buttonText?: string;
}

function QRContent({
  marketId,
  missionId,
  missionTitle,
  hint,
  onClose,
}: Pick<QRModalProps, "marketId" | "missionId" | "missionTitle" | "hint"> & {
  onClose: () => void;
}) {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setQrValue(null);
    let cancelled = false;
    fetch(`/api/markets/${marketId}/missions/${missionId}/qr-token`)
      .then((r) => r.json())
      .then(({ data }: { data: { token: string } }) => {
        if (cancelled) return;
        setQrValue(data.token);
        setSecondsLeft(300);
      });
    return () => {
      cancelled = true;
    };
  }, [marketId, missionId, refreshTick]);

  useInterval(
    () => {
      if (secondsLeft === null) return;
      if (secondsLeft <= 1) {
        setSecondsLeft(null);
        setRefreshTick((t) => t + 1);
      } else {
        setSecondsLeft((s) => (s ?? 1) - 1);
      }
    },
    secondsLeft !== null ? 1000 : null,
  );

  const timeLabel =
    secondsLeft !== null
      ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
      : null;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {missionTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl p-2"
          style={{ backgroundColor: "#0f172a", colorScheme: "dark only" }}
        >
          {qrValue ? (
            <QRCode
              value={qrValue}
              size={192}
              bgColor="#0f172a"
              fgColor="#94a3b8"
            />
          ) : (
            <div className="h-48 w-48 animate-pulse rounded-xl bg-gray-800" />
          )}
        </div>

        <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-amber-700">
            카메라로 스캔해주세요
          </p>
          {timeLabel && (
            <p
              className={`text-xs mt-0.5 font-medium ${secondsLeft !== null && secondsLeft < 30 ? "text-red-500" : "text-amber-600"}`}
            >
              유효시간 {timeLabel}
            </p>
          )}
          {hint && <p className="text-xs text-amber-600 mt-0.5">{hint}</p>}
        </div>
      </div>
    </Modal>
  );
}

export function QRModal({
  marketId,
  missionId,
  missionTitle,
  hint,
  disabled = false,
  buttonText = "QR 생성하기",
}: QRModalProps) {
  return (
    <Button
      onClick={() =>
        openModal((close) => (
          <QRContent
            marketId={marketId}
            missionId={missionId}
            missionTitle={missionTitle}
            hint={hint}
            onClose={close}
          />
        ))
      }
      disabled={disabled}
      className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
    >
      <QrCode className="mr-2 h-5 w-5" />
      {buttonText}
    </Button>
  );
}
