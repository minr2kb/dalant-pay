"use client";

import { useQueries } from "@tanstack/react-query";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSessionUserId } from "@/components/AuthGate";
import { MarketShareButton } from "@/components/MarketShareButton";
import { Button } from "@/components/ui/button";
import { formatKST } from "@/lib/format-date";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MyPageSkeleton } from "./MyPageSkeleton";

const THEME_OPTIONS = [
  { value: "system", label: "시스템", icon: Monitor },
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
] as const;

export function MyPageClient({
  marketId,
  initialUserId,
}: {
  marketId: string;
  initialUserId: string | null;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // useSessionUserId()가 비동기로 채워지기 전엔 서버가 이미 검증한 initialUserId로 쿼리 키를
  // 맞춰서 SSR prefetch 캐시를 첫 렌더부터 바로 쓴다 — UserHomeClient와 동일한 이유.
  const userId = useSessionUserId() ?? initialUserId;

  const [{ data: market }, { data: participants }] = useQueries({
    queries: [
      { ...marketsQuery.get({ marketId }), enabled: !!userId },
      {
        ...participantsQuery.get({ marketId, userId: userId ?? "" }),
        enabled: !!userId,
      },
    ],
  });

  const participant = participants?.participant;

  // isRestoring은 IndexedDB 복원 완료 여부만 본다 — 서버 prefetch(HydrationBoundary)로
  // 이미 데이터가 있으면 복원을 기다릴 이유가 없어 게이트에서 뺐다 (home/missions와 동일).
  if (!market || !participant) return <MyPageSkeleton />;

  const user = participant.user;

  const genderLabel = user.gender === "male" ? "남성" : "여성";
  const birthLabel = user.birthDate
    ? formatKST(user.birthDate, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        마이페이지
      </h1>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <InfoRow label="활동명" value={participant.displayName} />
        <InfoRow label="본명" value={user.realName} />
        <InfoRow label="생년월일" value={birthLabel} />
        <InfoRow label="성별" value={genderLabel} />
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <InfoRow label="마켓" value={market.title} />
        <InfoRow
          label={`보유 ${market.pointLabel}`}
          value={`${participant.balance} ${market.pointLabel}`}
          highlight
        />
      </div>

      <MarketShareButton marketId={marketId} marketTitle={market.title} />

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">화면 모드</p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors",
                theme === value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="h-12 w-full gap-2 text-red-500 border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>

      <p className="text-center text-xs text-gray-300 dark:text-gray-600">
        © 2026 Kyungbae Min
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
