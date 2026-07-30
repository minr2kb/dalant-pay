import webpush from "web-push";
import { supabase } from "@/lib/supabase/service";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
if (publicKey && privateKey) {
  webpush.setVapidDetails("mailto:kbmin1129@gmail.com", publicKey, privateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

// 실패해도 호출부의 본 작업(미션 인증, 전송 등)은 이미 끝난 뒤라 절대 throw하지 않는다 —
// 알림은 부가 기능이지 그 실패로 본 작업 응답을 막으면 안 된다.
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!publicKey || !privateKey || userIds.length === 0) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (!subs || subs.length === 0) return;

  const staleIds: string[] = [];
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint as string,
            keys: {
              p256dh: sub.p256dh as string,
              auth: sub.auth as string,
            },
          },
          JSON.stringify(payload),
        );
      } catch (e) {
        // 브라우저에서 구독이 만료/취소된 경우 — 다음 발송에서 또 실패하지 않게 정리한다.
        const status = (e as { statusCode?: number } | null)?.statusCode;
        if (status === 404 || status === 410) staleIds.push(sub.id as string);
      }
    }),
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}

export async function sendPushToMarketParticipants(
  marketId: string,
  payload: PushPayload,
) {
  const { data: participants } = await supabase
    .from("market_participants")
    .select("user_id")
    .eq("market_id", marketId);

  const userIds = (participants ?? []).map((p) => p.user_id as string);
  await sendPushToUsers(userIds, payload);
}
