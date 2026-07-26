"use client";

import { useMarketRealtime } from "@/hooks/use-market-realtime";

export function MarketRealtimeProvider({
  marketId,
  userId,
}: {
  marketId: string;
  userId: string;
}) {
  useMarketRealtime(marketId, userId);
  return null;
}
