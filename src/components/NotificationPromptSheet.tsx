"use client";

import { Bell } from "lucide-react";
import { isStandalone } from "@/components/InstallPwaBanner";
import { Button } from "@/components/ui/button";
import { openModal } from "@/lib/overlay";
import {
  getExistingPushSubscription,
  isPushSupported,
} from "@/lib/push/subscribe-client";
import { useNotificationSubscription } from "@/lib/push/use-notification-subscription";

const NOTIF_PROMPT_KEY = "notif-prompt-shown";

function NotificationPromptSheet({ onClose }: { onClose: () => void }) {
  const { subscribe, isSubscribing } = useNotificationSubscription();

  async function handleEnable() {
    await subscribe();
    onClose();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop click-to-close mirrors Modal.tsx; back-button closing (openModal) is the accessible path
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: stops backdrop close from firing when tapping the sheet itself */}
      <div
        className="mx-auto w-full max-w-lg rounded-t-3xl bg-white dark:bg-gray-900 p-6 pb-8 animate-in slide-in-from-bottom duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
          <Bell className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          알림을 켜두세요
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          미션 인증 결과와 달란트 수령 소식을 바로 받아볼 수 있어요
        </p>
        <div className="mt-6 space-y-2">
          <Button
            className="h-12 w-full rounded-2xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            onClick={handleEnable}
            disabled={isSubscribing}
          >
            {isSubscribing ? "설정 중…" : "알림 켜기"}
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full text-gray-500 dark:text-gray-400"
            onClick={onClose}
          >
            나중에 할게요
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          마이페이지에서 언제든 켤 수 있어요
        </p>
      </div>
    </div>
  );
}

// PWA로 설치해 실행 중인 유저에게 딱 한 번만 노출 — 거절/수락 여부와 무관하게
// localStorage에 표시 이력을 남겨서 다시는 띄우지 않는다.
export function maybeShowNotificationPrompt() {
  if (localStorage.getItem(NOTIF_PROMPT_KEY)) return;
  if (!isStandalone() || !isPushSupported()) return;
  if (Notification.permission === "denied") {
    localStorage.setItem(NOTIF_PROMPT_KEY, "true");
    return;
  }

  localStorage.setItem(NOTIF_PROMPT_KEY, "true");
  getExistingPushSubscription().then((sub) => {
    if (sub) return;
    openModal((close) => <NotificationPromptSheet onClose={close} />);
  });
}
