const CACHE_NAME = "dalant-pay-shell-v1";
const STATIC_EXT = /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("dalant-pay-shell-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // 앱 셸(문서/새로고침)은 최신 우선, 오프라인이면 마지막으로 캐시된 버전
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // 빌드 해시가 붙은 정적 자산은 불변이므로 캐시 우선
  if (
    url.pathname.startsWith("/_next/static/") ||
    STATIC_EXT.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});
