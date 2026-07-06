import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { listMissions } from "@/lib/data/missions";
import { getParticipant } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { missionsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminUserDetailClient } from "./AdminUserDetailClient";

export default async function AdminUserDetailPage(
  props: PageProps<"/markets/[id]/admin/users/[userId]">,
) {
  const { id: marketId, userId } = await props.params;
  const supabase = await createClient();
  const qc = getQueryClient();
  const [participant, missions] = await Promise.all([
    getParticipant(supabase, marketId, userId),
    listMissions(supabase, marketId),
  ]);
  qc.setQueryData(
    participantsQuery.get({ marketId, userId }).queryKey,
    participant,
  );
  qc.setQueryData(missionsQuery.list({ marketId }).queryKey, missions);
  return (
    <div>
      <div className="flex items-center gap-3 px-4 pb-4 max-w-lg mx-auto">
        <Link
          href={`/markets/${marketId}/admin/users`}
          className="text-gray-400"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          유저 상세
        </h1>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense
          fallback={
            <p className="py-8 text-center text-sm text-gray-400">
              불러오는 중…
            </p>
          }
        >
          <AdminUserDetailClient marketId={marketId} userId={userId} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
