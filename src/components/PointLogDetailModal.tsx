"use client";

import { useMutation } from "@tanstack/react-query";
import { ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { openImageViewer } from "@/components/ImageViewer";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { formatKST } from "@/lib/format-date";
import { openModal } from "@/lib/overlay";
import {
  missionsQuery,
  participantsQuery,
  pointLogsQuery,
} from "@/lib/query/queries";
import {
  getPointLogLabel,
  getPointLogSub,
  type Order,
  POINT_LOG_CATEGORY,
  type PointLog,
} from "@/types";

function formatDateTime(iso: string) {
  return formatKST(iso, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REVOCABLE_REASONS: PointLog["reasonType"][] = ["mission", "manual"];

function PointLogDetail({
  log,
  participantName,
  pointLabel,
  order,
  marketId,
  isAdmin,
  onClose,
}: {
  log: PointLog;
  participantName: string;
  pointLabel: string;
  order?: Order;
  marketId?: string;
  isAdmin?: boolean;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const photoUrls = log.photoUrl ? log.photoUrl.split(",") : [];
  const category = POINT_LOG_CATEGORY[log.reasonType];
  const canRevoke =
    isAdmin &&
    marketId &&
    !log.voidedAt &&
    REVOCABLE_REASONS.includes(log.reasonType);

  const { mutate: revoke, isPending: isRevoking } = useMutation(
    pointLogsQuery.revoke({
      invalidates: [
        participantsQuery.$key,
        pointLogsQuery.$key,
        missionsQuery.$key,
      ],
      onSuccess: () => {
        toast.success("철회했어요");
        onClose();
      },
      onError: () => toast.error("철회에 실패했어요"),
    }),
  );

  if (confirming && marketId) {
    return (
      <Modal onClose={onClose}>
        <div className="p-6 space-y-5 text-gray-900 dark:text-white">
          <h3 className="font-bold">철회할까요?</h3>
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-6 text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getPointLogLabel(log)}
            </p>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {log.amount > 0 ? `-${log.amount}` : `+${-log.amount}`}{" "}
              {pointLabel}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {participantName}의 {pointLabel}이 지급 시점 금액만큼 되돌아가요.
              기록은 철회됨 상태로 남아요.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setConfirming(false)}
              disabled={isRevoking}
            >
              취소
            </Button>
            <Button
              className="h-12 flex-1 bg-rose-500 hover:bg-rose-600"
              onClick={() => revoke({ marketId, logId: log.id })}
              disabled={isRevoking}
            >
              {isRevoking ? "철회 중…" : "철회"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {category.label}
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {getPointLogLabel(log)}
              {log.voidedAt && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  철회됨
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">참여자</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {participantName}
            </span>
          </div>
          {log.reasonType !== "mission" && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">내용</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {getPointLogSub(log, pointLabel)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              {pointLabel}
            </span>
            <span
              className={`font-bold tabular-nums ${log.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}
            >
              {log.amount > 0 ? `+${log.amount}` : log.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">시각</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDateTime(log.createdAt)}
            </span>
          </div>
          {log.verifiedByName && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">인증자</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {log.verifiedByName}
              </span>
            </div>
          )}
          {log.slot != null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">회차</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {log.slot}회차
              </span>
            </div>
          )}
        </div>

        {order && (
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <ShoppingBag className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                  <span>
                    {item.name} × {item.qty}
                  </span>
                </div>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {item.price * item.qty}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-400 dark:text-gray-500">
              <span>{order.verifiedByName} 처리</span>
              <span className="font-medium tabular-nums text-rose-400">
                -{order.total} 합계
              </span>
            </div>
          </div>
        )}

        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => openImageViewer(url)}
                className="aspect-square w-full overflow-hidden rounded-xl"
              >
                {/** biome-ignore lint/performance/noImgElement: thumbnail only */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {canRevoke && (
          <Button
            variant="outline"
            className="h-12 w-full border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
            onClick={() => setConfirming(true)}
          >
            철회
          </Button>
        )}
      </div>
    </Modal>
  );
}

export function openPointLogDetail({
  log,
  participantName,
  pointLabel,
  order,
  marketId,
  isAdmin,
}: {
  log: PointLog;
  participantName: string;
  pointLabel: string;
  order?: Order;
  marketId?: string;
  isAdmin?: boolean;
}) {
  openModal((close) => (
    <PointLogDetail
      log={log}
      participantName={participantName}
      pointLabel={pointLabel}
      order={order}
      marketId={marketId}
      isAdmin={isAdmin}
      onClose={close}
    />
  ));
}
