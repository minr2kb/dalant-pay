"use client";

import { Coins, CreditCard, ScanLine, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PointLogItem } from "@/components/points/PointLogItem";
import {
  SAMPLE_ADMIN_ACTIVITY,
  SAMPLE_MARKET,
  SAMPLE_MISSIONS,
} from "../../data";

function tryOnly() {
  toast("샘플 마켓에서는 체험만 가능해요");
}

const QUICK_ACTIONS = [
  {
    href: "/sample/admin/scan",
    icon: ScanLine,
    label: "미션 인증",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    color: "text-emerald-500",
  },
  {
    icon: Coins,
    label: `${SAMPLE_MARKET.pointLabel} 지급`,
    bg: "bg-purple-50 dark:bg-purple-900/30",
    color: "text-purple-500",
  },
  {
    icon: CreditCard,
    label: "물품 결제",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    color: "text-rose-500",
  },
];

export default function SampleAdminHomePage() {
  const activeMissions = SAMPLE_MISSIONS.filter((m) => m.isActive).length;
  const totalGranted = SAMPLE_ADMIN_ACTIVITY.filter(
    (a) => a.log.amount > 0,
  ).reduce((s, a) => s + a.log.amount, 0);

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6">
      <div className="sticky-header -mx-4 flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {SAMPLE_MARKET.title}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              관리자화면
            </h1>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
        <Link
          href="/sample/home"
          className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
        >
          <User className="h-3.5 w-3.5" />
          일반화면
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
            48
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            참여자
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
            {activeMissions}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            활성 미션
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-3.5 text-center">
          <p className="text-lg font-bold tabular-nums text-emerald-500">
            +{totalGranted}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            총 지급
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, bg, color }) => {
          const className =
            "flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95";
          const content = (
            <>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${bg}`}
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className={className}>
              {content}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              onClick={tryOnly}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          최근 활동
        </h2>
        <div className="space-y-2">
          {SAMPLE_ADMIN_ACTIVITY.map(({ log, participantName }) => (
            <PointLogItem
              key={log.id}
              log={log}
              pointLabel={SAMPLE_MARKET.pointLabel}
              participantName={participantName}
              onClick={tryOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
