"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  MarketFormFields,
  type MarketFormValues,
} from "@/components/market/MarketFormFields";
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

      <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-5 space-y-3">
        <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
          마켓 종료
        </p>
        <p className="text-xs text-rose-500 dark:text-rose-400">
          종료하면 모든 거래·미션 인증·신규 참여가 즉시 차단돼요. 조회는 계속
          가능해요.
        </p>
        <Button
          variant="outline"
          onClick={handleEndNow}
          disabled={isPending}
          className="h-10 w-full rounded-full border-rose-300 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/30"
        >
          지금 종료
        </Button>
      </div>

      <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-100 dark:bg-rose-950/50 p-5 space-y-3">
        <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
          마켓 완전 삭제
        </p>
        <p className="text-xs text-rose-600 dark:text-rose-400">
          되돌릴 수 없어요. 신중하게 결정해주세요.
        </p>
        <Button
          variant="outline"
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
          className="h-10 w-full rounded-full border-rose-400 text-rose-700 hover:bg-rose-200 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/50"
        >
          완전 삭제
        </Button>
      </div>
    </div>
  );
}
