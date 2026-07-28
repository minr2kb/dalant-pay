"use client";

import { QrCode, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { QRCodeImage } from "@/components/qr/QRCodeImage";
import { Button } from "@/components/ui/button";
import { useInterval } from "@/hooks/use-interval";
import { openModal } from "@/lib/overlay";
import { isSamsungInternetBrowser } from "@/lib/user-agent";

interface QRModalProps {
  marketId: string;
  missionId: string;
  userId: string;
  missionTitle: string;
  slot?: number;
  hint?: string;
  disabled?: boolean;
  buttonText?: string;
}

function QRContent({
  marketId,
  missionId,
  missionTitle,
  slot,
  hint,
  onClose,
}: Pick<
  QRModalProps,
  "marketId" | "missionId" | "missionTitle" | "slot" | "hint"
> & {
  onClose: () => void;
}) {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const isSamsungInternet = isSamsungInternetBrowser();

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTick isn't read in the body, it's a tick counter that intentionally re-triggers this fetch every 5 minutes
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
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {missionTitle}
            </h3>
            {slot !== undefined && (
              <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {slot}회차
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-2xl bg-white p-2">
          {qrValue ? (
            <QRCodeImage value={qrValue} size={272} />
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          )}
        </div>

        {isSamsungInternet && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-red-600">
              QR이 흐리게 보이면 삼성 인터넷 설정에서 다크 모드를 꺼주세요
            </p>
          </div>
        )}

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
  slot,
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
            slot={slot}
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
