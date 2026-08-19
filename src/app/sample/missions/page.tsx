"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { MissionCard } from "@/components/mission/MissionCard";
import { SAMPLE_MARKET_ID, SAMPLE_MISSIONS } from "../data";

export default function SampleMissionsPage() {
  const router = useRouter();

  // MissionCard는 실제 마켓 라우트(/markets/sample/missions/...)로 링크를 만든다 -
  // 존재하지 않는 마켓이라 그대로 두면 404가 난다. capture-phase preventDefault로
  // 기본 이동을 막고 샘플 전용 상세 라우트로 보낸다.
  function goToDetail(e: MouseEvent, missionId: string) {
    e.preventDefault();
    router.push(`/sample/missions/${missionId}`);
  }

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        미션 목록
      </h1>
      <div className="flex flex-col gap-2">
        {SAMPLE_MISSIONS.map((mission) => (
          <div
            key={mission.id}
            onClickCapture={(e) => goToDetail(e, mission.id)}
          >
            <MissionCard mission={mission} marketId={SAMPLE_MARKET_ID} />
          </div>
        ))}
      </div>
    </div>
  );
}
