import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { listParticipants } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersClient } from "./AdminUsersClient";
import Loading from "./loading";

export default async function AdminUsersPage(
  props: PageProps<"/markets/[id]/admin/users">,
) {
  const { id: marketId } = await props.params;
  const supabase = await createClient();
  const qc = getQueryClient();
  const participants = await listParticipants(supabase, marketId);
  qc.setQueryData(participantsQuery.list({ marketId }).queryKey, participants);
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        유저 관리
      </h1>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense fallback={<Loading />}>
          <AdminUsersClient marketId={marketId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
