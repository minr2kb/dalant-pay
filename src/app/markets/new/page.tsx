import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { canCreateMarket } from "@/lib/data/markets";
import { createClient } from "@/lib/supabase/server";
import { MarketNewClient } from "./MarketNewClient";

export default async function MarketNewPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/markets/new");

  const supabase = await createClient();
  const allowed = await canCreateMarket(supabase, userId);
  if (!allowed) redirect("/markets");

  return <MarketNewClient />;
}
