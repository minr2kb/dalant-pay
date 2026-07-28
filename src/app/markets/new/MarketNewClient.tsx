"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marketsQuery } from "@/lib/query/queries";

const dateInputClass =
  "h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-base text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export function MarketNewClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointLabel, setPointLabel] = useState("달란트");
  const [adminCode, setAdminCode] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const { mutate: createMarket, isPending } = useMutation(
    marketsQuery.create({
      invalidates: [marketsQuery.$key],
      onSuccess: (data) => {
        router.push(`/markets/${data.marketId}/admin/home`);
      },
      onError: () => {
        toast.error("마켓 생성에 실패했어요");
      },
    }),
  );

  const canSubmit =
    title.trim().length > 0 &&
    pointLabel.trim().length > 0 &&
    adminCode.trim().length >= 4 &&
    startsAt.length > 0 &&
    endsAt.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    createMarket({
      title: title.trim(),
      description: description.trim() || undefined,
      pointLabel: pointLabel.trim(),
      adminCode: adminCode.trim(),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    });
  }

  return (
    <div className="min-h-svh bg-white dark:bg-gray-950 px-6 pt-4 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"
      >
        <ChevronLeft className="h-4 w-4" />
        뒤로
      </button>

      <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
        마켓 만들기
      </h1>

      <div className="space-y-4">
        <Input
          placeholder="마켓 이름"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12"
          autoFocus
        />
        <Input
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-12"
        />
        <Input
          placeholder="포인트 이름 (예: 달란트)"
          value={pointLabel}
          onChange={(e) => setPointLabel(e.target.value)}
          className="h-12"
        />
        <Input
          placeholder="관리자 인증코드 (4자리 이상)"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          className="h-12"
        />
        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">시작 일시</p>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={dateInputClass}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">종료 일시</p>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={dateInputClass}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isPending}
        className="mt-8 h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
      >
        {isPending ? "만드는 중…" : "마켓 만들기"}
      </Button>
    </div>
  );
}
