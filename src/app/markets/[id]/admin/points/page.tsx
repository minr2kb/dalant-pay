"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle, CheckSquare, ChevronLeft, Square } from "lucide-react";
import Link from "next/link";
import { Suspense, use, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/executor";
import { participantsQuery } from "@/lib/query/queries";

function AdminPointsHeader({ marketId }: { marketId: string }) {
  return (
    <div className="sticky-header flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
      <Link
        href={`/markets/${marketId}/admin/home`}
        className="text-gray-400 dark:text-gray-500"
      >
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        달란트 일괄 지급
      </h1>
    </div>
  );
}

function AdminPointsBody({ marketId }: { marketId: string }) {
  const { data: participants } = useSuspenseQuery(
    participantsQuery.list({ marketId }),
  );

  const adjustMutation = useMutation(
    participantsQuery.adjustPoints({ invalidates: [participantsQuery.$key] }),
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const allSelected =
    participants.length > 0 && selected.size === participants.length;
  const n = Number(amount);

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(participants.map((p) => p.user.id)),
    );
  }

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }

  async function apply(sign: 1 | -1) {
    if (!n || selected.size === 0 || isApplying) return;
    setIsApplying(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selected).map((uid) =>
          adjustMutation.mutateAsync({
            marketId,
            userId: uid,
            amount: n * sign,
            memo: memo || undefined,
          }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const reason = (failed[0] as PromiseRejectedResult).reason;
        const msg = getApiErrorMessage(reason, "지급/차감에 실패했어요");
        toast.error(`${failed.length}명 처리 실패`, { description: msg });
      }
      if (failed.length < results.length) {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          지급 설정
        </p>
        <Input
          type="number"
          placeholder="달란트 수량"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 rounded-xl text-center tabular-nums text-lg font-bold"
        />
        <Input
          placeholder="메모 (예: 팀전 우승)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-xl"
        />
        <div className="flex gap-2">
          <Button
            onClick={() => apply(1)}
            disabled={!n || selected.size === 0 || isApplying}
            className="flex-1 h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 gap-1.5 font-semibold disabled:opacity-40"
          >
            {selected.size > 0 && n
              ? `${selected.size}명에게 +${n} 지급`
              : "지급"}
          </Button>
          <Button
            onClick={() => apply(-1)}
            disabled={!n || selected.size === 0 || isApplying}
            variant="outline"
            className="flex-1 h-11 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 gap-1.5 font-semibold disabled:opacity-40"
          >
            {selected.size > 0 && n
              ? `${selected.size}명에게 -${n} 차감`
              : "차감"}
          </Button>
        </div>
        {done && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {selected.size}명에게 적용됐어요
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleAll}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {allSelected ? (
          <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
        ) : (
          <Square className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0" />
        )}
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          전체 선택 ({selected.size}/{participants.length})
        </span>
      </button>

      <div className="space-y-2">
        {participants.map((p) => {
          const isSelected = selected.has(p.user.id);
          return (
            <button
              key={p.user.id}
              type="button"
              onClick={() => toggle(p.user.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-900"
                  : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0" />
              )}
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300">
                    {p.user.realName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {p.user.realName}
                    </p>
                    {p.role === "admin" && (
                      <span className="text-[10px] text-purple-500">
                        관리자
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-emerald-500">
                    {p.balance}
                  </p>
                  {n > 0 && isSelected && (
                    <p className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                      → {p.balance + n}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPointsPage(
  props: PageProps<"/markets/[id]/admin/points">,
) {
  const { id: marketId } = use(props.params);
  return (
    <div>
      <AdminPointsHeader marketId={marketId} />
      <Suspense
        fallback={
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
        }
      >
        <AdminPointsBody marketId={marketId} />
      </Suspense>
    </div>
  );
}
