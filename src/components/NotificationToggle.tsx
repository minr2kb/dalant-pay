"use client";

import { Switch } from "@/components/ui/switch";
import { useNotificationSubscription } from "@/lib/push/use-notification-subscription";

export function NotificationToggle() {
  const {
    supported,
    subscribed,
    checking,
    subscribe,
    unsubscribe,
    isSubscribing,
    isUnsubscribing,
  } = useNotificationSubscription();

  if (!supported || checking) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          알림 받기
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          미션 인증 결과와 달란트 수령 소식을 알려드려요
        </p>
      </div>
      <Switch
        checked={subscribed}
        onCheckedChange={(next) => (next ? subscribe() : unsubscribe())}
        disabled={isSubscribing || isUnsubscribing}
      />
    </div>
  );
}
