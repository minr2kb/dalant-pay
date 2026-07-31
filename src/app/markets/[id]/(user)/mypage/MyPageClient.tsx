"use client";

import * as Sentry from "@sentry/nextjs";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Camera, LayoutGrid, LogOut, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { toast } from "sonner";
import { useSessionUserId } from "@/components/AuthGate";
import { MarketShareButton } from "@/components/market/MarketShareButton";
import { NotificationToggle } from "@/components/NotificationToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/sign-out";
import { formatKST } from "@/lib/format-date";
import { marketsQuery, participantsQuery } from "@/lib/query/queries";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/upload";
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // useSessionUserId()가 비동기로 채워지기 전엔 서버가 이미 검증한 initialUserId로 쿼리 키를
  // 맞춰서 SSR prefetch 캐시를 첫 렌더부터 바로 쓴다 — UserHomeClient와 동일한 이유.
  const userId = useSessionUserId() ?? initialUserId;

  const { mutate: changeAvatar, isPending: isUploadingAvatar } = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("로그인이 필요해요");
      const avatarUrl = await uploadAvatar(file, userId);
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantsQuery.$key });
    },
    // 기존엔 onError가 없어서 실패해도 유저 피드백도, Sentry 리포트도 없이 조용히 묻혔다
    onError: (e) => {
      Sentry.captureException(e);
      toast.error("프로필 사진 변경에 실패했어요", {
        description: "네트워크 상태를 확인하고 다시 시도해주세요",
      });
    },
  });

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
    await signOut();
    router.push("/login");
  }

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        마이페이지
      </h1>

      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="relative active:scale-95 transition-transform"
        >
          <Avatar className="size-28">
            <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-4xl">
              {user.realName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-gray-950">
            {isUploadingAvatar ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) changeAvatar(file);
            e.target.value = "";
          }}
        />
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {participant.displayName}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {user.realName}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
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

      <NotificationToggle />

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
        className="h-12 w-full gap-2 rounded-2xl border-gray-200 dark:border-gray-700"
        render={<Link href="/markets" />}
      >
        <LayoutGrid className="h-4 w-4" />
        마켓 목록으로
      </Button>

      <Button
        variant="outline"
        className="h-12 w-full gap-2 rounded-2xl text-red-500 border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
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
