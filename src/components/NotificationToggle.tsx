"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  createPushSubscription,
  getExistingPushSubscription,
  isPushSupported,
  toSubscriptionPayload,
} from "@/lib/push/subscribe-client";
import { pushQuery } from "@/lib/query/queries";

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isPushSupported()) {
      setChecking(false);
      return;
    }
    setSupported(true);
    getExistingPushSubscription()
      .then((sub) => setSubscribed(!!sub))
      .finally(() => setChecking(false));
  }, []);

  const { mutate: subscribeOnServer, isPending: isSubscribing } = useMutation(
    pushQuery.subscribe({
      onError: () => toast.error("알림 설정에 실패했어요"),
    }),
  );
  const { mutate: unsubscribeOnServer, isPending: isUnsubscribing } =
    useMutation(
      pushQuery.unsubscribe({
        onError: () => toast.error("알림 해제에 실패했어요"),
      }),
    );

  async function handleToggle(next: boolean) {
    if (!next) {
      const sub = await getExistingPushSubscription();
      if (sub) {
        const payload = toSubscriptionPayload(sub);
        await sub.unsubscribe();
        unsubscribeOnServer({ endpoint: payload.endpoint });
      }
      setSubscribed(false);
      return;
    }

    const sub = await createPushSubscription();
    if (!sub) {
      toast.error("알림 권한이 필요해요", {
        description: "브라우저 설정에서 알림을 허용해주세요",
      });
      return;
    }
    subscribeOnServer(toSubscriptionPayload(sub));
    setSubscribed(true);
  }

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
        onCheckedChange={handleToggle}
        disabled={isSubscribing || isUnsubscribing}
      />
    </div>
  );
}
