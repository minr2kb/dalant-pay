import { AuthGate } from "@/components/AuthGate";
import { MarketsListClient } from "./MarketsListClient";

export default function MarketsPage() {
  return (
    <AuthGate>
      <MarketsListClient />
    </AuthGate>
  );
}
