"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marketsQuery } from "@/lib/query/queries";
import type { Market } from "@/types";

const dateInputClass =
  "h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-base text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

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
  const [title, setTitle] = useState(initialMarket.title);
  const [description, setDescription] = useState(initialMarket.description);
  const [pointLabel, setPointLabel] = useState(initialMarket.pointLabel);
  const [adminCode, setAdminCode] = useState(initialMarket.adminCode);
  const [startsAt, setStartsAt] = useState(
    toLocalInput(initialMarket.startsAt),
  );
  const [endsAt, setEndsAt] = useState(toLocalInput(initialMarket.endsAt));

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
      title: title.trim(),
      description: description.trim(),
      pointLabel: pointLabel.trim(),
      adminCode: adminCode.trim(),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
  }

  function handleEndNow() {
    const nowLocal = toLocalInput(new Date().toISOString());
    setEndsAt(nowLocal);
    updateMarket({
      marketId,
      endsAt: new Date(nowLocal).toISOString(),
    });
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 px-4 pt-4 pb-28">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          마켓 설정
        </h1>

        <div className="space-y-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <Input
            placeholder="마켓 이름"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12"
          />
          <Input
            placeholder="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12"
          />
          <Input
            placeholder="포인트 이름"
            value={pointLabel}
            onChange={(e) => setPointLabel(e.target.value)}
            className="h-12"
          />
          <Input
            placeholder="관리자 인증코드"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="h-12"
          />
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              시작 일시
            </p>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={dateInputClass}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              종료 일시
            </p>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={dateInputClass}
            />
          </div>

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
      </div>
    </div>
  );
}
