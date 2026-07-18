import { Calendar, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { mapMarket } from "@/lib/db";
import { formatKST } from "@/lib/format-date";
import { supabase } from "@/lib/supabase";
import { JoinButton } from "./JoinButton";

export async function generateMetadata(
  props: PageProps<"/markets/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const { data } = await supabase
    .from("markets")
    .select("title, description")
    .eq("id", id)
    .single();
  if (!data) return {};

  const title = data.title as string;
  const description = (data.description as string | null) ?? undefined;
  return {
    title,
    description,
    // 이 세그먼트가 openGraph/twitter를 직접 지정하면 루트의 opengraph-image.png가
    // 상속되지 않아 이미지를 명시해야 한다.
    openGraph: { title, description, images: ["/opengraph-image.png"] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
    },
  };
}

export default async function MarketJoinPage(
  props: PageProps<"/markets/[id]">,
) {
  const { id } = await props.params;

  // 이미 참여 중인 유저(특히 PWA start_url로 매번 여기부터 여는 경우)는
  // 참여 화면을 거칠 필요 없이 바로 홈으로 — 안 그러면 페이지 로드가 두 번 겹친다.
  const userId = await getCurrentUserId();
  if (userId) {
    const { data: existingParticipant } = await supabase
      .from("market_participants")
      .select("id")
      .eq("market_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingParticipant) redirect(`/markets/${id}/home`);
  }

  // 로그인 전 방문자(QR 랜딩)도 봐야 하는 공개 화면이라 세션 클라이언트 대신 서비스롤로 조회한다.
  const { data: marketRow } = await supabase
    .from("markets")
    .select("*")
    .eq("id", id)
    .single();

  const { count } = await supabase
    .from("market_participants")
    .select("*", { count: "exact", head: true })
    .eq("market_id", id);

  if (!marketRow) return null;
  const market = mapMarket(marketRow);

  const startDate = formatKST(market.startsAt, { month: "long", day: "numeric" });
  const endDate = formatKST(market.endsAt, { month: "long", day: "numeric" });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white dark:bg-gray-900 px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="relative mx-auto h-16 w-16 rounded-2xl bg-emerald-500 p-3">
            <Image
              src="/logo_w.svg"
              alt="달란트페이"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {market.title}
          </h1>
          {market.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {market.description}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>
              {startDate} ~ {endDate}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 text-emerald-500" />
            <span>현재 {count ?? 0}명 참여 중</span>
          </div>
        </div>

        <JoinButton marketId={id} />
      </div>
    </div>
  );
}
