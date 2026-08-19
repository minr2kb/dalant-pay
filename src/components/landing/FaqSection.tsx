import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "참가자도 앱을 설치해야 하나요?",
    a: "아니요. 웹으로 바로 접속하고 카카오 로그인 하나로 시작합니다. 참가자와 스태프 모두 앱 설치가 필요 없습니다.",
  },
  {
    q: "현장 준비 시간이 얼마나 걸리나요?",
    a: "관리자 코드를 입력하는 순간 바로 스태프 권한이 생기고, 그 자리에서 미션과 물품을 세팅할 수 있습니다. 사전 계정이나 별도 제작 업체가 필요 없습니다.",
  },
  {
    q: "행사가 끝나면 데이터는 어떻게 되나요?",
    a: "마켓 단위로 격리되어 있어 행사가 끝나도 기록은 남고, 다음 행사는 새 마켓만 세팅해 다시 사용할 수 있습니다. 참가자 계정도 다음 행사로 이어집니다.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-muted/30 py-24">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-balance text-center text-2xl font-bold sm:text-3xl">
          자주 묻는 질문
        </h2>
        <div className="mt-14">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-border py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold break-keep">
                {q}
                <ChevronDown className="size-4 shrink-0 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 break-keep">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
