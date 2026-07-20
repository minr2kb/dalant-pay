"use client";
import {
  IsRestoringProvider,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { OverlayProvider } from "overlay-kit";
import { useEffect, useState } from "react";
import { makeQueryClient } from "@/lib/query/get-query-client";
import { CLIENT_CACHE_COOKIE } from "@/lib/query/persist";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: CookieStore API isn't supported on iOS Safari, which this PWA targets
    document.cookie = `${CLIENT_CACHE_COOKIE}=1; path=/; max-age=${60 * 60 * 24}`;
  }, []);

  // 서비스워커 캐싱을 되돌린 뒤(4c94546)에도, 예전에 그걸 설치했던 브라우저는
  // 등록이 남아있어 계속 이제는 없는 /sw.js를 폴링한다 — 남은 등록/캐시를 정리한다.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      });
    }
    if ("caches" in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.startsWith("dalant-pay-shell-")) caches.delete(key);
        }
      });
    }
  }, []);

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
