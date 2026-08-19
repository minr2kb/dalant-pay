"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  OctagonAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  MarketFormFields,
  type MarketFormValues,
} from "@/components/market/MarketFormFields";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import { marketsQuery } from "@/lib/query/queries";
import type { Market } from "@/types";
import { DeleteMarketModal } from "./DeleteMarketModal";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function MarketSettingsClient({
  marketId,
  initialMarket,
}: {
  marketId: string;
  initialMarket: Market & { adminCode: string };
}) {
  const [values, setValues] = useState<MarketFormValues>({
    title: initialMarket.title,
    description: initialMarket.description,
    pointLabel: initialMarket.pointLabel,
    adminCode: initialMarket.adminCode,
    startsAt: toLocalInput(initialMarket.startsAt),
    endsAt: toLocalInput(initialMarket.endsAt),
  });

  function update(patch: Partial<MarketFormValues>) {
    setValues((v) => ({ ...v, ...patch }));
  }

  const { mutate: updateMarket, isPending } = useMutation(
    marketsQuery.update({
      invalidates: [marketsQuery.$key],
      onSuccess: () => toast.success("저장했어요"),
      onError: () => toast.error("저장에 실패했어요"),
    }),
  );

  function handleSave() {
    updateMarket({
      marketId,
      title: values.title.trim(),
      description: values.description.trim(),
      pointLabel: values.pointLabel.trim(),
      adminCode: values.adminCode.trim(),
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
    });
  }

  function handleEndNow() {
    const nowLocal = toLocalInput(new Date().toISOString());
    update({ endsAt: nowLocal });
    updateMarket({
      marketId,
      endsAt: new Date(nowLocal).toISOString(),
    });
  }

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center gap-3 px-4 pt-4 pb-3">
        <Link
          href={`/markets/${marketId}/admin/home`}
          className="text-gray-400 dark:text-gray-500"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          마켓 설정
        </h1>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <MarketFormFields values={values} onChange={update} />

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="h-12 w-full rounded-full"
        >
          {isPending ? "저장 중…" : "저장"}
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-primary">요금제</p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          마켓·참가자 정원이 부족하거나 그룹 관리 기능이 필요하면 플랜을
          업그레이드해보세요.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            openModal((close) => (
              <UpgradeModal
                reason="더 큰 규모의 행사를 준비하고 계신가요?"
                onClose={close}
              />
            ))
          }
          className="h-10 w-full rounded-full"
        >
          요금제 업그레이드
        </Button>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-xs font-semibold tracking-wide text-gray-400 dark:text-gray-500">
          위험 구역
        </p>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              마켓 종료
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            종료하면 모든 거래·미션 인증·신규 참여가 즉시 차단돼요. 조회는 계속
            가능해요.
          </p>
          <Button
            variant="outline"
            onClick={handleEndNow}
            disabled={isPending}
            className="h-10 w-full rounded-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            지금 종료
          </Button>
        </div>

        <div className="rounded-2xl border-2 border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <OctagonAlert className="h-4 w-4 text-rose-700 dark:text-rose-400" />
            <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
              마켓 완전 삭제
            </p>
          </div>
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
            되돌릴 수 없어요. 신중하게 결정해주세요.
          </p>
          <Button
            onClick={() =>
              openModal((close) => (
                <DeleteMarketModal
                  marketId={marketId}
                  marketTitle={initialMarket.title}
                  onClose={close}
                />
              ))
            }
            disabled={isPending}
            className="h-10 w-full rounded-full bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
          >
            완전 삭제
          </Button>
        </div>
      </div>
    </div>
  );
}
