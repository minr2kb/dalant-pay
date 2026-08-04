import { Users } from "lucide-react";
import Link from "next/link";
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
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          유저 관리
        </h1>
        <Link
          href={`/markets/${marketId}/admin/users/groups`}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Users className="h-3.5 w-3.5" />
          그룹 관리
        </Link>
      </div>
      <Hydrated qc={qc}>
        <Suspense fallback={<Loading />}>
          <AdminUsersClient marketId={marketId} />
        </Suspense>
      </Hydrated>
    </div>
  );
}
