import { Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { listParticipants } from "@/lib/data/participants";
import { getMarketOwnerPlan } from "@/lib/data/plans";
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
  // 플랜 조회가 실패해도(엣지케이스) 정원 표시만 못 할 뿐, 유저 목록 자체는
  // 계속 보여야 해서 이 페이지 렌더링을 막지 않는다.
  const [qc, plan] = await Promise.all([
    hydrate(getQueryClient(), {
      queryKey: participantsQuery.list({ marketId }).queryKey,
      queryFn: () => listParticipants(supabase, marketId),
    }),
    getMarketOwnerPlan(supabase, marketId).catch(() => ({
      participantLimit: null,
    })),
  ]);
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
          <AdminUsersClient
            marketId={marketId}
            participantLimit={plan.participantLimit}
          />
        </Suspense>
      </Hydrated>
    </div>
  );
}
