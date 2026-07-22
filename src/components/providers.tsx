"use client";
import {
  IsRestoringProvider,
  QueryClientProvider,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { OverlayProvider } from "overlay-kit";
import { useEffect, useState } from "react";
import { makeQueryClient } from "@/lib/query/get-query-client";
import { CLIENT_CACHE_COOKIE } from "@/lib/query/persist";

const SHELL_PAGES_CACHE = "pages";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [isRestoring, setIsRestoring] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: CookieStore API isn't supported on iOS Safari, which this PWA targets
    document.cookie = `${CLIENT_CACHE_COOKIE}=1; path=/; max-age=${60 * 60 * 24}`;
  }, []);

  // 오프라인 새로고침 지원: 방문한 페이지의 문서/정적 자산을 캐싱하는 서비스워커
  // (src/sw.ts, serwist.config.mjs) 등록. @serwist/window의 Serwist 클래스가
  // controller가 실제로 넘어오는 타이밍(clients.claim 이후)까지 알아서 처리해준다 —
  // 직접 registration 상태를 다루지 않는다.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    import("@serwist/window").then(({ Serwist }) => {
      new Serwist("/sw.js").register();
    });
  }, []);

  // 클라이언트 사이드 라우팅(Link 클릭)은 문서 자체를 새로 fetch하지 않아 서비스워커의
  // "pages" 캐시가 안 채워진다 — 그 상태로 오프라인 새로고침하면 그 라우트만 실패한다.
  // 라우트가 바뀔 때마다 아직 캐시에 없는 경우에만 문서를 한 번 더 fetch해서(서비스워커의
  // NetworkFirst 규칙이 자동으로 캐싱) 다음 오프라인 새로고침에 대비한다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is only the route-change trigger, the URL itself comes from window.location.href
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("caches" in window) || !navigator.onLine) return;
    const url = window.location.href;
    caches.open(SHELL_PAGES_CACHE).then(async (cache) => {
      if (await cache.match(url, { ignoreSearch: true })) return;
      const page = await fetch(url).catch(() => null);
      if (page?.ok) cache.put(url, page.clone());
    });
  }, [pathname]);

  // idb-keyval 등 영속화 관련 무게(~29KB)를 초기 크리티컬 번들에서 빼기 위해
  // 마운트 후에만 동적 import한다 — 그동안은 인메모리 QueryClient로 정상 동작하고,
  // 복원이 끝나면 캐시된 데이터로 갈아끼워진다.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    import("@/lib/query/persist-setup").then(({ setupPersistence }) => {
      if (cancelled) return;
      setupPersistence(queryClient).then((unsub) => {
        if (cancelled) return unsub();
        unsubscribe = unsub;
        setIsRestoring(false);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <IsRestoringProvider value={isRestoring}>
          <OverlayProvider>{children}</OverlayProvider>
        </IsRestoringProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
