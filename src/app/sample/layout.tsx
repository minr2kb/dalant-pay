"use client";

import { Repeat } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FloatingTabBar } from "@/components/FloatingTabBar";

const USER_TABS = [
  { label: "홈", segment: "sample/home", href: "/sample/home", icon: "Home" },
  {
    label: "미션",
    segment: "sample/missions",
    href: "/sample/missions",
    icon: "ListTodo",
  },
  {
    label: "랭킹",
    segment: "sample/ranking",
    href: "/sample/ranking",
    icon: "Trophy",
  },
];

const ADMIN_TABS = [
  {
    label: "홈",
    segment: "sample/admin/home",
    href: "/sample/admin/home",
    icon: "Home",
  },
  {
    label: "스캔",
    segment: "sample/admin/scan",
    href: "/sample/admin/scan",
    icon: "QrCode",
  },
  {
    label: "미션",
    segment: "sample/admin/missions",
    href: "/sample/admin/missions",
    icon: "ListTodo",
  },
];

export default function SampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/sample/admin");
  const toggleHref = isAdmin ? "/sample/home" : "/sample/admin/home";

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-40 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
        <span>체험용 샘플 마켓이에요 — 실제로 저장되지 않아요</span>
        <Link
          href={toggleHref}
          className="flex items-center gap-1 rounded-full bg-white/70 dark:bg-black/20 px-2.5 py-1 font-semibold"
        >
          <Repeat className="h-3 w-3" />
          {isAdmin ? "유저 화면" : "관리자 화면"}
        </Link>
      </div>
      <main className="min-h-svh pb-28">{children}</main>
      <FloatingTabBar tabs={isAdmin ? ADMIN_TABS : USER_TABS} />
    </div>
  );
}
