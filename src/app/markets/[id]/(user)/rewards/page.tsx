import { listItems } from "@/lib/data/items";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { prefetchQuietly } from "@/lib/query/prefetch";
import { itemsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { RewardsClient } from "./RewardsClient";

export default async function RewardsPage(
  props: PageProps<"/markets/[id]/rewards">,
) {
  const { id: marketId } = await props.params;
  const qc = getQueryClient();

  await prefetchQuietly(async () => {
    const supabase = await createClient();
    await hydrate(qc, {
      queryKey: itemsQuery.list({ marketId }).queryKey,
      queryFn: () => listItems(supabase, marketId),
    });
  });

  return (
    <Hydrated qc={qc}>
      <RewardsClient marketId={marketId} />
    </Hydrated>
  );
}
