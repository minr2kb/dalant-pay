"use client";

import dynamic from "next/dynamic";

// ponytail: ssr:false must be called from a Client Component (Next.js 16 restriction) -
// this route is client-only by design (no prefetch/hydration), so skip SSR entirely to
// avoid an unauthenticated server-side fetch during the SSR pass.
const ScanContent = dynamic(
  () => import("./ScanContent").then((m) => m.ScanContent),
  { ssr: false },
);

export function ScanPageClient({ marketId }: { marketId: string }) {
  return <ScanContent marketId={marketId} />;
}
