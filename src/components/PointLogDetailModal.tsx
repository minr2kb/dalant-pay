"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { openModal } from "@/lib/overlay";
import {
  getPointLogLabel,
  getPointLogSub,
  POINT_LOG_CATEGORY,
  type PointLog,
} from "@/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PointLogDetail({
  log,
  participantName,
  pointLabel,
  onClose,
}: {
  log: PointLog;
  participantName: string;
  pointLabel: string;
  onClose: () => void;
}) {
  const photoUrls = log.photoUrl ? log.photoUrl.split(",") : [];
  const category = POINT_LOG_CATEGORY[log.reasonType];
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

        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url) => (
              // biome-ignore lint/performance/noImgElement: <explanation>
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function openPointLogDetail({
  log,
  participantName,
  pointLabel,
}: {
  log: PointLog;
  participantName: string;
  pointLabel: string;
}) {
  openModal((close) => (
    <PointLogDetail
      log={log}
      participantName={participantName}
      pointLabel={pointLabel}
      onClose={close}
    />
  ));
}
