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

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [isRestoring, setIsRestoring] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    document.cookie = `${CLIENT_CACHE_COOKIE}=1; path=/; max-age=${60 * 60 * 24}`;
  }, []);

  // 오프라인 새로고침 지원: 앱 셸(문서/정적 자산)만 캐싱하는 서비스워커.
  // /api/*는 건드리지 않는다 — 그건 이미 react-query persister(IndexedDB)와
  // offlineGuardPlugin이 각각 읽기/쓰기 경로에서 처리하고 있다.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  // 클라이언트 사이드 라우팅(Link 클릭)은 mode:'navigate' fetch가 없어 서비스워커의
  // 캐싱 로직을 안 타므로, 라우트가 바뀔 때마다 직접 알려서 캐싱시킨다.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker?.controller?.postMessage({
      type: "cache-shell",
      url: `${window.location.origin}${pathname}`,
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
