"use client";

import {
  History,
  Home,
  ListTodo,
  type LucideIcon,
  QrCode,
  ShoppingBag,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  ListTodo,
  History,
  User,
  QrCode,
  Wallet,
  Users,
  ShoppingBag,
  Trophy,
};

export interface TabItem {
  label: string;
  segment: string;
  href: string;
  icon: string;
}

interface FloatingTabBarProps {
  tabs: TabItem[];
}

export function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // 찌그러짐(Squash) 상태 관리
  const [isMoving, setIsMoving] = useState(false);
  const prevIndexRef = useRef<number>(-1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: setPendingHref is a stable useState setter, intentionally omitted so this reset only fires on pathname change, not on setter identity
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const activeStates = tabs.map((tab) =>
    pendingHref ? pendingHref === tab.href : pathname.includes(tab.segment),
  );
  const activeIndex = activeStates.indexOf(true);

  // activeIndex가 변경될 때 순간적으로 scale 변형 트리거
  useEffect(() => {
    // 최초 로드 시나 이전과 동일한 인덱스일 때는 동작하지 않음
    if (
      prevIndexRef.current !== -1 &&
      prevIndexRef.current !== activeIndex &&
      activeIndex >= 0
    ) {
      setIsMoving(true);

      // transition duration(300ms)에 맞춰 효과 해제
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, 300);

      return () => clearTimeout(timer);
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg">
      <div className="relative flex items-center rounded-full bg-white/10 dark:bg-gray-900/70 backdrop-blur-sm px-2 py-2 shadow-[0_3px_10px_0_rgba(0,0,0,0.1)] dark:shadow-[0_3px_10px_0_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/10">
        {activeIndex >= 0 && (
          <div
            aria-hidden
            className="absolute inset-y-2 rounded-full bg-black/3 dark:bg-white/5 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300"
            style={{
              left: "0.5rem",
              width: `calc((100% - 1rem) / ${tabs.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
              transitionTimingFunction: "cubic-bezier(0.3, 1.3, 0.8, 1)",
            }}
          />
        )}
        {tabs.map((tab, index) => {
          const isActive = activeStates[index];
          const Icon = ICON_MAP[tab.icon] ?? Home;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              onClick={() => setPendingHref(tab.href)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-colors duration-300",
                isActive
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-semibold" : "font-medium",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
