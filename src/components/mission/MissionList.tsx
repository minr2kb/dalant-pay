"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MissionCard } from "@/components/mission/MissionCard";
import { getMissionStatus, type Mission } from "@/types";

type Tab = "active" | "completed" | "past" | "upcoming";
const TABS: Tab[] = ["active", "completed", "upcoming", "past"];

const LABEL: Record<Tab, string> = {
  active: "진행중",
  completed: "완료됨",
  past: "지남",
  upcoming: "예정",
};
const EMPTY: Record<Tab, string> = {
  active: "진행중인 미션이 없어요",
  completed: "완료한 미션이 없어요",
  past: "지난 미션이 없어요",
  upcoming: "예정된 미션이 없어요",
};

function isCompleted(mission: Mission): boolean {
  // 무제한 미션은 완료 처리하지 않고 계속 진행중 탭에 둔다
  if (mission.limitCount === null) return false;
  if (!mission.slots || mission.slots.length === 0) return false;
  return (
    mission.slots.filter((s) => s.verifiedAt !== null).length >=
    mission.limitCount
  );
}

export function MissionList({
  missions,
  marketId,
}: {
  missions: Mission[];
  marketId: string;
}) {
  // 미션 상세에서 뒤로가기했을 때 원래 보고 있던 탭으로 돌아가야 해서 —
  // MissionCard가 현재 탭을 ?from=으로 넘기고, 상세 페이지가 그걸 다시 ?tab=으로
  // 돌려준다 (src/components/mission/MissionCard.tsx, MissionDetailClient.tsx 참고).
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabParam && (TABS as string[]).includes(tabParam)
      ? (tabParam as Tab)
      : "active",
  );

  // 탭 전환을 URL에도 즉시 반영해둔다 — 안 그러면 이 페이지 자체의 history entry엔
  // 탭 정보가 없어서, 실제 브라우저 뒤로가기(제스처/버튼)로 돌아왔을 때 위 ?from=/?tab=
  // 우회로를 안 거치고 이 entry로 바로 복원되며 항상 "active"로 리셋돼버린다.
  // push가 아니라 replace라 history는 안 쌓인다.
  function selectTab(t: Tab) {
    setTab(t);
    const base = `/markets/${marketId}/missions`;
    router.replace(t === "active" ? base : `${base}?tab=${t}`, {
      scroll: false,
    });
  }

  const byTab: Record<Tab, Mission[]> = {
    completed: missions.filter((m) => isCompleted(m)),
    active: missions.filter(
      (m) => getMissionStatus(m) === "active" && !isCompleted(m),
    ),
    upcoming: missions.filter((m) => getMissionStatus(m) === "upcoming"),
    past: missions.filter(
      (m) => getMissionStatus(m) === "past" && !isCompleted(m),
    ),
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectTab(t)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {LABEL[t]}
            <span
              className={`text-[11px] tabular-nums ${tab === t ? "opacity-80" : "text-gray-400"}`}
            >
              {byTab[t].length}
            </span>
          </button>
        ))}
      </div>

      <div key={tab} className="flex flex-col gap-2">
        {byTab[tab].length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 animate-in fade-in-0 duration-300">
            {EMPTY[tab]}
          </div>
        ) : (
          byTab[tab].map((mission, i) => (
            <div
              key={mission.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <MissionCard
                mission={mission}
                marketId={marketId}
                fromTab={tab}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
