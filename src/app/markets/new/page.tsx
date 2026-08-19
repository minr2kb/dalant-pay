import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { canCreateMarket } from "@/lib/data/markets";
import { createClient } from "@/lib/supabase/server";
import { MarketNewClient } from "./MarketNewClient";

export default async function MarketNewPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/markets/new");

  const supabase = await createClient();
  // fail-closed: 플랜 조회가 실패해도 생성 화면을 열어주면 안 되니 false로 처리
  const allowed = await canCreateMarket(supabase, userId).catch(() => false);
  if (!allowed) redirect("/markets");

  return <MarketNewClient />;
}
