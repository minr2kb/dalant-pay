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
    document.cookie = `${CLIENT_CACHE_COOKIE}=1; path=/; max-age=${60 * 60 * 24}`;
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
