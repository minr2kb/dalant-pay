"use client";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { OverlayProvider } from "overlay-kit";
import { useState } from "react";
import { makeQueryClient } from "@/lib/query/get-query-client";
import {
  CACHE_BUSTER,
  createHomeCachePersister,
  shouldPersistQuery,
} from "@/lib/query/persist";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(createHomeCachePersister);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          buster: CACHE_BUSTER,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
      >
        <OverlayProvider>{children}</OverlayProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}
