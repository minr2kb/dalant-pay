import type { SupabaseClient } from "@supabase/supabase-js";
import { mapGroup } from "@/lib/data/mappers";

export async function listGroups(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("market_id", marketId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapGroup);
}
