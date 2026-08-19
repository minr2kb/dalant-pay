"use client";

import { ChevronLeft, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { openModal } from "@/lib/overlay";
import { SampleScanFlowModal } from "./SampleScanFlowModal";

export default function SampleAdminScanPage() {
  const router = useRouter();

  function openManualVerify() {
    openModal((close) => <SampleScanFlowModal onClose={close} />);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center px-4 pt-14">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="ml-3 text-sm font-semibold text-white">QR 스캔</p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <div className="relative h-64 w-64 overflow-hidden rounded-3xl">
            <div className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-white/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="h-24 w-24 text-white/20" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">
              샘플에서는 카메라 스캔이 비활성화되어 있어요
            </p>
            <p className="text-xs text-white/60 max-w-xs">
              대신 아래 수동인증으로 실제 인증 흐름을 체험해보세요.
            </p>
          </div>
          <button
            type="button"
            onClick={openManualVerify}
            className="h-10 rounded-full bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30"
          >
            수동인증
          </button>
        </div>
      </div>
    </div>
  );
}
