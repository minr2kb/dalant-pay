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
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 온라인에서 한 번도 열어보지 않은 페이지 — 캐시가 없으니 이대로 반환.
    // 여기서 throw하면 respondWith의 프로미스가 reject되어 콘솔에
    // "FetchEvent.respondWith received an error"가 뜬다.
    return new Response(
      "오프라인 상태입니다. 온라인에서 한 번 열어둔 페이지만 새로고침할 수 있어요.",
      { status: 503, statusText: "Offline" },
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response(null, { status: 503, statusText: "Offline" });
  }
}

// SPA 클라이언트 네비게이션(Link 클릭)은 mode:'navigate' fetch를 발생시키지 않아
// 위 fetch 핸들러를 안 타므로, 방문한 라우트를 앱이 직접 알려주면 여기서 대신 캐싱한다.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-shell") return;
  const url = event.data.url;
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // 오프라인이면 조용히 스킵 — 다음 온라인 방문 때 다시 시도된다.
      }
    }),
  );
});

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
