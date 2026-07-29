import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listMissions } from "@/lib/data/missions";
import { getParticipant } from "@/lib/data/participants";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Hydrated } from "@/lib/query/hydrate";
import { missionsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/server";
import { AdminUserDetailClient } from "./AdminUserDetailClient";

export default async function AdminUserDetailPage(
  props: PageProps<"/markets/[id]/admin/users/[userId]">,
) {
  const { id: marketId, userId } = await props.params;
  const supabase = await createClient();
  const callerId = await getCurrentUserId();
  // participant는 아래 헤더에서도 직접 쓰이는 값이라 hydrate/hydrateAll(캐시 채우기 전용)로
  // 감추지 않고 그대로 받아서 qc에 직접 얹는다.
  const [participant, missions, caller] = await Promise.all([
    getParticipant(supabase, marketId, userId),
    listMissions(supabase, marketId),
    callerId
      ? supabase
          .from("market_participants")
          .select("role")
          .eq("market_id", marketId)
          .eq("user_id", callerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const isOwner = caller.data?.role === "owner";
  const qc = getQueryClient();
  qc.setQueryData(
    participantsQuery.get({ marketId, userId }).queryKey,
    participant,
  );
  qc.setQueryData(missionsQuery.list({ marketId }).queryKey, missions);
  return (
    <Hydrated qc={qc}>
      <div>
        <div className="sticky-header flex items-center gap-3 px-4 pt-4 pb-4 max-w-lg mx-auto">
          <Link
            href={`/markets/${marketId}/admin/users`}
            className="text-gray-400"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <Avatar>
            <AvatarImage
              src={participant.participant.user.avatarUrl ?? undefined}
              alt=""
            />
            <AvatarFallback>
              {participant.participant.user.realName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {participant.participant.displayName}
          </h1>
        </div>
        <Suspense
          fallback={
            <p className="py-8 text-center text-sm text-gray-400">
              불러오는 중…
            </p>
          }
        >
          <AdminUserDetailClient
            marketId={marketId}
            userId={userId}
            isOwner={isOwner}
          />
        </Suspense>
      </div>
    </Hydrated>
  );
}
