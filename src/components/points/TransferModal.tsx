"use client";

import { useMutation, useQueries } from "@tanstack/react-query";
import { ArrowLeft, QrCode, Search, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { QRScanner } from "@/components/qr/QRScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQR } from "@/lib/qr";
import {
  marketsQuery,
  participantsQuery,
  pointLogsQuery,
  transferQuery,
} from "@/lib/query/queries";
import type { MarketParticipant } from "@/types";

type Step = "select" | "amount" | "confirm";

interface TransferModalProps {
  marketId: string;
  userId: string;
  onClose: () => void;
}

export function TransferModal({
  marketId,
  userId,
  onClose,
}: TransferModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [activeTab, setActiveTab] = useState<"qr" | "search">("qr");
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recipient, setRecipient] = useState<MarketParticipant | null>(null);
  const [amount, setAmount] = useState("");
  // 모달 하나(= 한 번의 전송 시도) 수명 동안 고정 - 재시도가 같은 키를 재사용해
  // 서버가 이체를 다시 안 태우고 첫 실행 결과를 그대로 돌려주게 한다.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [{ data: participants }, { data: market }] = useQueries({
    queries: [
      participantsQuery.list({ marketId }),
      marketsQuery.get({ marketId }),
    ],
  });
  const pointLabel = market?.pointLabel ?? "달란트";
  const otherParticipants = useMemo(
    () => (participants ?? []).filter((p) => p.user.id !== userId),
    [participants, userId],
  );
  const filtered = useMemo(
    () =>
      otherParticipants.filter((p) =>
        p.displayName.toLowerCase().includes(search.toLowerCase()),
      ),
    [otherParticipants, search],
  );

  const { mutate: doTransfer, isPending } = useMutation(
    transferQuery.transfer({
      invalidates: [participantsQuery.$key, pointLogsQuery.$key],
      headers: { "Idempotency-Key": idempotencyKey },
      onSuccess: () => {
        onClose();
      },
    }),
  );

  function handleScan(value: string) {
    setScanOpen(false);
    const parsed = parseQR(value);
    if (parsed?.type === "mission") {
      toast.error("미션 QR이에요. 상대방의 결제 QR을 스캔해주세요");
      return;
    }
    if (!parsed || parsed.type !== "pay") {
      toast.error("올바른 QR이 아니에요");
      return;
    }
    if (parsed.marketId !== marketId) {
      toast.error("다른 마켓의 QR이에요");
      return;
    }
    if (parsed.userId === userId) {
      toast.error("자신에게는 전송할 수 없어요");
      return;
    }
    const found = otherParticipants.find((p) => p.user.id === parsed.userId);
    if (!found) {
      toast.error("이 마켓의 참가자가 아니에요");
      return;
    }
    setRecipient(found);
    setStep("amount");
  }

  function handleSelectRecipient(p: MarketParticipant) {
    setRecipient(p);
    setStep("amount");
  }

  function handleAmountNext() {
    const n = parseInt(amount, 10);
    if (!n || n < 1) return;
    setStep("confirm");
  }

  function handleConfirm() {
    if (!recipient) return;
    doTransfer({
      toUserId: recipient.user.id,
      amount: parseInt(amount, 10),
      marketId,
    });
  }

  if (scanOpen) {
    return (
      <QRScanner
        open={scanOpen}
        title="QR 스캔"
        hint="상대방의 결제용 QR을 스캔하세요"
        onScan={handleScan}
        onClose={() => setScanOpen(false)}
      />
    );
  }

  return (
    <Modal className="z-[60]" onClose={onClose}>
      <div className="p-6 space-y-5 text-gray-900 dark:text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {step !== "select" && (
              <button
                type="button"
                onClick={() =>
                  setStep(step === "confirm" ? "amount" : "select")
                }
                className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="font-bold text-gray-900 dark:text-white">
              {step === "select"
                ? `${pointLabel} 전송`
                : step === "amount"
                  ? "금액 입력"
                  : "전송 확인"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["qr", "search"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 h-9 whitespace-nowrap rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {tab === "qr" ? "QR 스캔" : "이름 검색"}
                </button>
              ))}
            </div>

            {activeTab === "qr" ? (
              <Button className="h-12 w-full" onClick={() => setScanOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                QR 스캔하기
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="h-12 pl-9"
                    placeholder="이름으로 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {filtered.map((p) => (
                    <button
                      key={p.user.id}
                      type="button"
                      onClick={() => handleSelectRecipient(p)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                        <UserRound className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {p.displayName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {p.balance} {pointLabel} 보유
                        </p>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && search && (
                    <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                      검색 결과가 없어요
                    </p>
                  )}
                  {otherParticipants.length === 0 && !search && (
                    <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                      참가자를 불러오는 중...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "amount" && recipient && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <UserRound className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  받는 사람
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {recipient.displayName}
                </p>
              </div>
            </div>
            <Input
              className="h-12 text-center text-lg font-bold"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="전송할 금액 입력"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              className="h-12 w-full"
              onClick={handleAmountNext}
              disabled={!amount || parseInt(amount, 10) < 1}
            >
              다음
            </Button>
          </div>
        )}

        {step === "confirm" && recipient && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                아래 내용으로 전송할까요?
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {recipient.displayName}에게
              </p>
              <p className="text-2xl font-bold text-emerald-500 tabular-nums">
                {parseInt(amount, 10)} {pointLabel}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => setStep("amount")}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                className="h-12 flex-1"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "전송 중…" : "전송"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
