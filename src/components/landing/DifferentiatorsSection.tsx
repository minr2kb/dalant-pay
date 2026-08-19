import { Database, Eye, ShieldCheck, Zap } from "lucide-react";

const DIFFERENTIATORS = [
  {
    icon: ShieldCheck,
    pain: "기록이 없어 지급 분쟁·중복 지급이 반복",
    solution: "인증 즉시 서버 기록, 중복 지급 자동 차단",
  },
  {
    icon: Eye,
    pain: "잔액 확인용 점수판, 스태프에게 물어봐야 함",
    solution: "참가자가 직접 실시간 잔액·랭킹 확인",
  },
  {
    icon: Zap,
    pain: "행사마다 코인 제작·점수판·전용 앱 새로 준비",
    solution: "마켓 복제로 몇 분 만에 새 행사 세팅",
  },
  {
    icon: Database,
    pain: "행사 끝나면 기록 증발, 다음 기획은 감으로",
    solution: "미션·시간대별 활동 로그가 그대로 남음",
  },
];

export function DifferentiatorsSection() {
  return (
    <section id="differentiators" className="scroll-mt-24 bg-muted/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-balance text-center text-2xl font-bold sm:text-3xl">
          리워드 시스템, 이렇게 달라집니다
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {DIFFERENTIATORS.map(({ icon: Icon, pain, solution }) => (
            <div key={pain} className="rounded-2xl border border-border p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-medium text-gray-400">AS-IS</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-keep">
                {pain}
              </p>
              <p className="mt-3 text-xs font-medium text-primary">TO-BE</p>
              <p className="mt-1 font-semibold break-keep">{solution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
