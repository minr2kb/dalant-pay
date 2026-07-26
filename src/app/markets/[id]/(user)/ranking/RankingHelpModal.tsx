"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { openModal } from "@/lib/overlay";

function RankingHelpContent({
  pointLabel,
  onClose,
}: {
  pointLabel: string;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">
            랭킹은 이렇게 계산돼요
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li>
            랭킹은{" "}
            <strong className="text-gray-900 dark:text-white">
              지금까지 모은 {pointLabel}
            </strong>
            을 기준으로 해요. 마켓에서 구매해도 랭킹은 그대로예요.
          </li>
          <li>
            미션 보상과 관리자 지급(차감 포함)만 반영돼요. 구매, 다른 사람과의
            전송은 랭킹에 영향을 주지 않아요.
          </li>
          <li>철회된 미션 인증은 처음부터 없었던 것으로 계산돼요.</li>
        </ul>
      </div>
    </Modal>
  );
}

export function openRankingHelp({ pointLabel }: { pointLabel: string }) {
  openModal((close) => (
    <RankingHelpContent pointLabel={pointLabel} onClose={close} />
  ));
}
