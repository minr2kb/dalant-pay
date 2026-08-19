"use client";

import { Camera, LayoutGrid, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatKST } from "@/lib/format-date";
import { cn, firstChar } from "@/lib/utils";
import { SAMPLE_BALANCE, SAMPLE_MARKET, SAMPLE_USER_NAME } from "../data";

const THEME_OPTIONS = [
  { value: "system", label: "시스템", icon: Monitor },
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
] as const;

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

export default function SampleMyPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="sticky-header -mx-4 px-4 pt-4 pb-3 text-xl font-bold text-gray-900 dark:text-white">
        마이페이지
      </h1>

      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
        <button
          type="button"
          onClick={tryOnly}
          className="relative active:scale-95 transition-transform"
        >
          <Avatar className="size-28">
            <AvatarFallback className="text-4xl">
              {firstChar(SAMPLE_USER_NAME)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-gray-950">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {SAMPLE_USER_NAME}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            체험용 참여자
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <InfoRow
          label="생년월일"
          value={formatKST("2000-01-01", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
        <InfoRow label="성별" value="비공개" />
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <InfoRow label="마켓" value={SAMPLE_MARKET.title} />
        <InfoRow
          label={`보유 ${SAMPLE_MARKET.pointLabel}`}
          value={`${SAMPLE_BALANCE} ${SAMPLE_MARKET.pointLabel}`}
          highlight
        />
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">화면 모드</p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 whitespace-nowrap rounded-xl py-3 text-xs font-medium transition-colors",
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
        onClick={tryOnly}
        className="h-12 w-full gap-2 rounded-2xl border-gray-200 dark:border-gray-700"
      >
        <LayoutGrid className="h-4 w-4" />
        마켓 목록으로
      </Button>

      <Button
        variant="outline"
        onClick={tryOnly}
        className="h-12 w-full gap-2 rounded-2xl text-red-500 border-red-100 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>
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
