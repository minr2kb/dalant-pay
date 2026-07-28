import { Suspense } from "react";
import { listParticipants } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated, hydrate } from "@/lib/query/hydrate";
import { participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersClient } from "./AdminUsersClient";
import Loading from "./loading";

export default async function AdminUsersPage(
  props: PageProps<"/markets/[id]/admin/users">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const qc = await hydrate(getQueryClient(), {
    queryKey: participantsQuery.list({ marketId }).queryKey,
    queryFn: () => listParticipants(supabase, marketId),
  });
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        유저 관리
      </h1>
      <Hydrated qc={qc}>
        <Suspense fallback={<Loading />}>
          <AdminUsersClient marketId={marketId} />
        </Suspense>
      </Hydrated>
    </div>
  );
}
