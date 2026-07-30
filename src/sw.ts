/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // /api/*는 이미 offlineGuardPlugin(요청 전 오프라인 차단)과 IndexedDB 쿼리
    // 퍼시스턴스(persist-setup.ts)가 각각 쓰기/읽기 경로를 담당 중이다. defaultCache의
    // NetworkFirst 규칙을 그대로 두면 admin 전용 응답까지 별도 Cache Storage에 새어
    // 남는다 — persist.ts가 admin 쿼리를 화이트리스트에서 뺀 의도가 깨진다.
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

type PushPayload = { title: string; body: string; url: string };

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json() as PushPayload;
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url;
  if (!url) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find(
          (c) =>
            new URL(c.url).pathname ===
            new URL(url, self.location.href).pathname,
        );
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
