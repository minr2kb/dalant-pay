import type { SupabaseClient } from "@supabase/supabase-js";
import { mapItem } from "@/lib/data/mappers";

export async function listItems(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from("market_items")
    .select("*")
    .eq("market_id", marketId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItem);
}
