"use client";

import { QrCode } from "lucide-react";

export default function SampleAdminScanPage() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center px-6 text-center space-y-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <QrCode className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        샘플에서는 QR 스캔이 비활성화되어 있어요
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
        실제 마켓에서는 이 화면에서 카메라로 참가자의 QR을 스캔해 미션을
        인증해요.
      </p>
    </div>
  );
}
