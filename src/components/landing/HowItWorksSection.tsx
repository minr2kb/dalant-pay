"use client";

import { Coins, QrCode, Send, ShoppingBag, Trophy } from "lucide-react";
import { type RefObject, useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const BRANCHES = [
  { icon: ShoppingBag, label: "리워드 구매", curvature: 150 },
  { icon: Send, label: "포인트 전송", curvature: 0 },
  { icon: Trophy, label: "랭킹", curvature: -150 },
];

function Node({
  icon: Icon,
  label,
  nodeRef,
  className,
}: {
  icon: typeof QrCode;
  label: string;
  nodeRef: RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 z-10", className)}>
      <div
        ref={nodeRef}
        className="flex size-14 items-center justify-center rounded-full border-2 border-border bg-background text-primary shadow-sm dark:bg-gray-900"
      >
        <Icon className="size-6" />
      </div>
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const pointRef = useRef<HTMLDivElement>(null);
  const branchRef0 = useRef<HTMLDivElement>(null);
  const branchRef1 = useRef<HTMLDivElement>(null);
  const branchRef2 = useRef<HTMLDivElement>(null);
  const branchRefs = [branchRef0, branchRef1, branchRef2];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-white dark:bg-gray-950"
    >
      <div className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-balance text-center text-2xl font-bold sm:text-3xl">
          행사 참여가 리워드가 되는 순간
        </h2>
        <p className="mt-3 text-balance text-center text-gray-600 dark:text-gray-400">
          오프라인 활동으로 얻어진 포인트는 또 다른 참여를 이끌어 냅니다.
        </p>

        <div
          ref={containerRef}
          className="relative mt-16 flex items-center justify-between gap-4 sm:gap-10"
        >
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={missionRef}
            toRef={pointRef}
            duration={3}
            gradientStartColor="oklch(0.696 0.17 162.48)"
            gradientStopColor="oklch(0.696 0.17 162.48)"
          />
          {BRANCHES.map(({ label, curvature }, i) => (
            <AnimatedBeam
              key={label}
              containerRef={containerRef}
              fromRef={pointRef}
              toRef={branchRefs[i]}
              curvature={curvature}
              duration={3}
              delay={0.3 + i * 0.2}
              gradientStartColor="oklch(0.696 0.17 162.48)"
              gradientStopColor="oklch(0.696 0.17 162.48)"
            />
          ))}
          <Node icon={QrCode} label="미션 인증" nodeRef={missionRef} />
          <Node icon={Coins} label="포인트 적립" nodeRef={pointRef} />

          <div className="flex flex-col gap-8 sm:gap-10">
            {BRANCHES.map(({ icon, label }, i) => (
              <Node
                key={label}
                icon={icon}
                label={label}
                nodeRef={branchRefs[i]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
