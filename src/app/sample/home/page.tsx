"use client";

import { ArrowRightLeft, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { NumberTicker } from "@/components/NumberTicker";
import { PointLogItem } from "@/components/points/PointLogItem";
import { PayQRButton } from "@/components/qr/PayQRButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { firstChar } from "@/lib/utils";
import {
  SAMPLE_BALANCE,
  SAMPLE_MARKET,
  SAMPLE_MARKET_ID,
  SAMPLE_POINT_LOGS,
  SAMPLE_USER_ID,
  SAMPLE_USER_NAME,
} from "../data";

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

export default function SampleHomePage() {
  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{firstChar(SAMPLE_USER_NAME)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {SAMPLE_MARKET.title}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {SAMPLE_USER_NAME}
            </h1>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-emerald-500 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">
              보유 {SAMPLE_MARKET.pointLabel}
            </p>
            <NumberTicker
              value={SAMPLE_BALANCE}
              className="text-4xl font-bold tabular-nums"
            />
            <p className="text-sm opacity-70">{SAMPLE_MARKET.pointLabel}</p>
          </div>
          <PayQRButton
            marketId={SAMPLE_MARKET_ID}
            userId={SAMPLE_USER_ID}
            userName={SAMPLE_USER_NAME}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          onClick={tryOnly}
          className="h-12 gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 rounded-2xl font-semibold"
        >
          <ArrowRightLeft className="h-4 w-4" />
          {SAMPLE_MARKET.pointLabel} 전송
        </Button>
        <Button
          onClick={tryOnly}
          className="h-12 gap-2 rounded-2xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
        >
          <ScanLine className="h-4 w-4" />
          QR 인증해주기
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          최근 내역
        </h2>
        <div className="space-y-2">
          {SAMPLE_POINT_LOGS.map((log) => (
            <PointLogItem
              key={log.id}
              log={log}
              pointLabel={SAMPLE_MARKET.pointLabel}
              onClick={tryOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
