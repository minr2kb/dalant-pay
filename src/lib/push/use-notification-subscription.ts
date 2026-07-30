"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createPushSubscription,
  getExistingPushSubscription,
  isPushSupported,
  toSubscriptionPayload,
} from "@/lib/push/subscribe-client";
import { pushQuery } from "@/lib/query/queries";

export function useNotificationSubscription() {
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

  async function subscribe() {
    const sub = await createPushSubscription();
    if (!sub) {
      toast.error("알림 권한이 필요해요", {
        description: "브라우저 설정에서 알림을 허용해주세요",
      });
      return false;
    }
    subscribeOnServer(toSubscriptionPayload(sub));
    setSubscribed(true);
    return true;
  }

  async function unsubscribe() {
    const sub = await getExistingPushSubscription();
    if (sub) {
      const payload = toSubscriptionPayload(sub);
      await sub.unsubscribe();
      unsubscribeOnServer({ endpoint: payload.endpoint });
    }
    setSubscribed(false);
  }

  return {
    supported,
    subscribed,
    checking,
    subscribe,
    unsubscribe,
    isSubscribing,
    isUnsubscribing,
  };
}
