"use client";

import { useMutation, useSuspenseQueries } from "@tanstack/react-query";
import { CheckCircle2, Minus, Plus, ShoppingCart } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { QRScanner } from "@/components/qr/QRScanner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/executor";
import { parseQR } from "@/lib/qr";
import {
  itemsQuery,
  marketsQuery,
  ordersQuery,
  participantsQuery,
} from "@/lib/query/queries";
import type { MarketItem, MarketParticipant } from "@/types";

type CartEntry = { item: MarketItem; qty: number };
type ScanState = "idle" | "scanning" | "picking_user" | "confirm" | "done";

function ItemGrid({
  items,
  cart,
  onAdd,
}: {
  items: MarketItem[];
  cart: CartEntry[];
  onAdd: (item: MarketItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const inCart = cart.find((e) => e.item.id === item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAdd(item)}
            className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-colors active:scale-95 ${
              inCart
                ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {inCart && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {inCart.qty}
              </span>
            )}
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {item.name}
            </p>
            <p className="text-base font-bold tabular-nums text-emerald-500">
              {item.price}
            </p>
          </button>
        );
      })}
      {items.length === 0 && (
        <p className="col-span-2 py-6 text-center text-sm text-gray-400">
          등록된 물품이 없어요
        </p>
      )}
    </div>
  );
}

function CartSummary({
  cart,
  total,
  onChangeQty,
}: {
  cart: CartEntry[];
  total: number;
  onChangeQty: (itemId: string, delta: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 dark:border-gray-800">
        <ShoppingCart className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          장바구니
        </p>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {cart.map(({ item, qty }) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {item.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeQty(item.id, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Minus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="w-6 text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onChangeQty(item.id, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Plus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="w-12 text-right text-sm tabular-nums text-rose-500">
                -{item.price * qty}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          합계
        </span>
        <span className="text-base font-bold tabular-nums text-rose-500">
          -{total}
        </span>
      </div>
    </div>
  );
}

function PickUserSheet({
  participants,
  pointLabel,
  onSelect,
}: {
  participants: MarketParticipant[];
  pointLabel: string;
  onSelect: (participant: MarketParticipant) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-end">
      <div className="max-h-[70svh] overflow-y-auto rounded-t-3xl bg-white dark:bg-gray-900 px-6 pb-10 pt-5 space-y-4">
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          누구의 QR인가요?
        </p>
        <div className="space-y-2">
          {participants.map((p) => (
            <button
              key={p.user.id}
              type="button"
              onClick={() => onSelect(p)}
              className="flex h-14 w-full items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 text-left hover:bg-rose-50 hover:border-rose-200 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-600 dark:text-gray-300">
                {p.user.realName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {p.user.realName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {p.balance} {pointLabel} 보유
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmSheet({
  user,
  cart,
  total,
  isPending,
  onBack,
  onConfirm,
}: {
  user: MarketParticipant;
  cart: CartEntry[];
  total: number;
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-end">
      <div className="rounded-t-3xl bg-white dark:bg-gray-900 px-6 pb-10 pt-5 space-y-5">
        <div className="mx-auto h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-base font-bold text-gray-600 dark:text-gray-300">
            {user.user.realName[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {user.user.realName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              잔액 {user.balance} → {user.balance - total}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-1">
          {cart.map(({ item, qty }) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-gray-600 dark:text-gray-300"
            >
              <span>
                {item.name} × {qty}
              </span>
              <span className="tabular-nums">{item.price * qty}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-sm font-bold">
            <span>합계</span>
            <span className="tabular-nums text-rose-500">-{total}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-12 flex-1 rounded-full text-sm font-semibold"
          >
            다시 선택
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="h-12 flex-1 rounded-full bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600"
          >
            결제 확인
          </Button>
        </div>
      </div>
    </div>
  );
}

function DoneSheet({
  user,
  total,
  pointLabel,
  onReset,
}: {
  user: MarketParticipant;
  total: number;
  pointLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <CheckCircle2 className="h-20 w-20 text-rose-300" />
      <div>
        <p className="text-xl font-bold text-white">결제 완료!</p>
        <p className="mt-1 text-sm text-white/60">
          {user.user.realName} -{total} {pointLabel}
        </p>
      </div>
      <Button
        onClick={onReset}
        className="mt-4 h-12 w-full max-w-xs rounded-full bg-white text-sm font-semibold text-gray-900 hover:bg-white/90"
      >
        다음 결제
      </Button>
    </div>
  );
}

function PosInner({ marketId }: { marketId: string }) {
  const [{ data: items }, { data: participants }, { data: market }] =
    useSuspenseQueries({
      queries: [
        itemsQuery.list({ marketId }),
        participantsQuery.list({ marketId }),
        marketsQuery.get({ marketId }),
      ],
    });

  const pointLabel = market.pointLabel;

  const orderMutation = useMutation(
    ordersQuery.create({ invalidates: [participantsQuery.$key] }),
  );

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedUser, setScannedUser] = useState<MarketParticipant | null>(
    null,
  );

  const total = cart.reduce((s, e) => s + e.item.price * e.qty, 0);

  function addToCart(item: MarketItem) {
    setCart((prev) => {
      const e = prev.find((e) => e.item.id === item.id);
      return e
        ? prev.map((e) =>
            e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e,
          )
        : [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((e) => (e.item.id === itemId ? { ...e, qty: e.qty + delta } : e))
        .filter((e) => e.qty > 0),
    );
  }

  function selectUser(participant: MarketParticipant) {
    if (participant.balance < total) {
      toast.error("잔액이 부족해요", {
        description: `${participant.user.realName}님의 잔액은 ${participant.balance} ${pointLabel}이에요`,
      });
      setScanState("scanning");
      return;
    }
    setScannedUser(participant);
    setScanState("confirm");
  }

  function handleScan(val: string) {
    const qr = parseQR(val);
    if (qr?.type === "mission") {
      toast.error("미션 QR이에요", { description: "스캔 화면을 이용해주세요" });
      return;
    }
    if (qr?.type === "pay") {
      const participant = participants.find((p) => p.user.id === qr.userId);
      if (participant) {
        selectUser(participant);
        return;
      }
      toast.error("이 마켓의 참여자 QR이 아니에요");
      return;
    }
    setScanState("picking_user");
  }

  async function confirmPayment() {
    if (!scannedUser) return;
    try {
      await orderMutation.mutateAsync({
        marketId,
        userId: scannedUser.user.id,
        items: cart.map(({ item, qty }) => ({
          name: item.name,
          price: item.price,
          qty,
        })),
      });
      setScanState("done");
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "결제에 실패했습니다.");
      toast.error("결제 실패", { description: msg });
    }
  }

  function reset() {
    setScanState("idle");
    setScannedUser(null);
    setCart([]);
  }

  const updatedUser = scannedUser
    ? (participants.find((p) => p.user.id === scannedUser.user.id) ??
      scannedUser)
    : null;

  return (
    <>
      <div className="px-4 max-w-lg mx-auto space-y-5">
        <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
          물품 결제
        </h1>

        <ItemGrid items={items} cart={cart} onAdd={addToCart} />

        {cart.length > 0 && (
          <CartSummary cart={cart} total={total} onChangeQty={changeQty} />
        )}

        {cart.length > 0 ? (
          <Button
            onClick={() => setScanState("scanning")}
            className="h-12 w-full rounded-2xl bg-rose-500 text-sm font-semibold text-white hover:bg-rose-600"
          >
            결제하기 (-{total})
          </Button>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">
            물품을 선택하면 장바구니에 담겨요
          </p>
        )}
      </div>

      <QRScanner
        open={scanState !== "idle"}
        title="결제 QR 스캔"
        hint="유저의 결제 QR을 화면 중앙에 맞춰주세요"
        badge={
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold tabular-nums text-white">
            -{total} {pointLabel}
          </span>
        }
        onScan={handleScan}
        onClose={() => setScanState("idle")}
      >
        {scanState === "picking_user" && (
          <PickUserSheet
            participants={participants}
            pointLabel={pointLabel}
            onSelect={selectUser}
          />
        )}

        {scanState === "confirm" && updatedUser && (
          <ConfirmSheet
            user={updatedUser}
            cart={cart}
            total={total}
            isPending={orderMutation.isPending}
            onBack={() => setScanState("picking_user")}
            onConfirm={confirmPayment}
          />
        )}

        {scanState === "done" && updatedUser && (
          <DoneSheet
            user={updatedUser}
            total={total}
            pointLabel={pointLabel}
            onReset={reset}
          />
        )}
      </QRScanner>
    </>
  );
}

export function PosContent({ marketId }: { marketId: string }) {
  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중…</p>
      }
    >
      <PosInner marketId={marketId} />
    </Suspense>
  );
}
