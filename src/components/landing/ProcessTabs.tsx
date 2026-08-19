"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type StepTab = "participant" | "admin";

const STEP_GROUPS: Record<
  StepTab,
  {
    label: string;
    steps: { title: string; description: string; shot: string }[];
  }
> = {
  participant: {
    label: "참가자",
    steps: [
      {
        title: "QR 스캔 후 입장",
        description:
          "현장 QR을 찍고 카카오 로그인만 하면 바로 행사에 들어갑니다.",
        shot: "QR 스캔 → 로그인 화면",
      },
      {
        title: "미션 확인",
        description: "진행 중인 미션 목록에서 인증 방식과 보상을 확인합니다.",
        shot: "미션 목록 · 상세 화면",
      },
      {
        title: "QR·사진으로 인증",
        description:
          "참가자끼리 QR을 주고받거나 사진을 올려 미션을 완료합니다.",
        shot: "QR 생성/스캔, 사진 업로드 화면",
      },
      {
        title: "구매·전송·랭킹",
        description:
          "적립된 포인트로 마켓에서 구매하거나 다른 참가자에게 전송합니다.",
        shot: "마켓 구매, 전송, 랭킹 화면",
      },
    ],
  },
  admin: {
    label: "운영진",
    steps: [
      {
        title: "관리자 코드로 즉시 승격",
        description: "홈 화면에서 코드를 입력하는 순간 스태프 권한이 생깁니다.",
        shot: "관리자 코드 입력 화면",
      },
      {
        title: "미션·물품 세팅",
        description:
          "행사 진행 중에도 미션과 판매 물품을 바로 추가·수정합니다.",
        shot: "미션 관리, 물품 관리 화면",
      },
      {
        title: "스캔 한 번으로 승인",
        description:
          "참가자 QR을 스캔하면 미션 승인과 포인트 지급이 동시에 끝납니다.",
        shot: "관리자 QR 스캔 화면",
      },
      {
        title: "결제·수동 지급",
        description:
          "현장 판매는 POS로 결제받고, 필요하면 포인트를 직접 지급합니다.",
        shot: "POS 결제, 수동 지급 화면",
      },
    ],
  },
};

export function ProcessTabs() {
  const [tab, setTab] = useState<StepTab>("participant");
  const steps = STEP_GROUPS[tab].steps;

  return (
    <div>
      <div className="mx-auto flex w-fit gap-1 rounded-full border border-border bg-white p-1 dark:bg-gray-950">
        {(Object.keys(STEP_GROUPS) as StepTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-gray-500 hover:text-foreground dark:text-gray-400",
            )}
          >
            {STEP_GROUPS[key].label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-keep">
              {step.description}
            </p>
            {/* ponytail: 실제 스크린샷 나오면 next/image로 교체 */}
            <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 text-center text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
