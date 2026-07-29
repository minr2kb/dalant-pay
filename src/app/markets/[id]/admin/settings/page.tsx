import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getMarketForOwner } from "@/lib/data/markets";
import { createClient } from "@/lib/supabase/server";
import { MarketSettingsClient } from "./MarketSettingsClient";

export default async function MarketSettingsPage(
  props: PageProps<"/markets/[id]/admin/settings">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("market_participants")
    .select("role")
    .eq("market_id", marketId)
    .eq("user_id", userId)
    .maybeSingle();
  if (participant?.role !== "owner")
    redirect(`/markets/${marketId}/admin/home`);

  const market = await getMarketForOwner(supabase, marketId);

  return <MarketSettingsClient marketId={marketId} initialMarket={market} />;
}
