"use client";

import { createContext, type ReactNode, useContext } from "react";
import { MarketRealtimeProvider } from "@/components/MarketRealtimeProvider";
import { useOptimisticSession } from "@/hooks/use-optimistic-session";

const SessionUserIdContext = createContext<string | null>(null);

export function useSessionUserId() {
  return useContext(SessionUserIdContext);
}

export function AuthGate({
  marketId,
  children,
}: {
  marketId?: string;
  children: ReactNode;
}) {
  const { userId } = useOptimisticSession();

  return (
    <SessionUserIdContext.Provider value={userId}>
      {userId && marketId && (
        <MarketRealtimeProvider marketId={marketId} userId={userId} />
      )}
      {children}
    </SessionUserIdContext.Provider>
  );
}
