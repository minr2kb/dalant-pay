const REVIEW_CASES = [
  {
    title: "소모품 낭비 감소 → 운영비 절감",
    description:
      "내 포인트로 산 물건이라는 감각에, 마시다 만 음료를 버리는 일이 줄고 재구매 빈도도 낮아졌습니다.",
    shot: "마켓 구매 화면",
  },
  {
    title: "쉬는 시간에도 끊이지 않는 참여",
    description:
      "자유시간(오후 1~3시)·취침 전(밤 11시)에 참여가 몰렸습니다. 인증할 목적이 있으니 계속 대화가 이어집니다.",
    shot: "참가자끼리 QR 인증하는 화면",
  },
  {
    title: "고가 아이템 하나가 만들어낸 팀 협력",
    description:
      "평균 잔액 20포인트 안팎인 마켓에 50포인트짜리 아이템을 심자, 마감 직전 포인트를 몰아줘 4개 팀 모두 구매했습니다.",
    shot: "포인트 전송 화면",
  },
  {
    title: "사진 미션으로 자연스럽게 남은 활동 기록",
    description:
      "조별 포즈샷, 셀카 등 업로드형 미션 인증 과정에서 참가자별 활동 사진 아카이브가 자연스럽게 쌓였습니다.",
    shot: "업로드형 미션 인증 화면",
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 bg-gray-950 py-24 text-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-sm font-medium text-primary">
          실사용 사례
        </p>
        <h2 className="mt-2 text-balance text-center text-2xl font-bold sm:text-3xl">
          실제 4박 5일 수련회 사용 후기
        </h2>
        <p className="mt-4 text-center text-sm text-white/50 break-keep">
          물 빼고 전부 포인트로 구매하게 설계한 마켓의 실제 기록
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {REVIEW_CASES.map(({ title, description, shot }, i) => (
            <div
              key={title}
              style={{ animationDelay: `${i * 150}ms` }}
              className="flex animate-in flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 fade-in-0 slide-in-from-bottom-4 fill-mode-both duration-700 sm:flex-row"
            >
              {/* ponytail: 실제 스크린샷 나오면 next/image로 교체 */}
              <div className="flex aspect-3/4 w-full shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-3 text-center text-xs text-white/40 sm:w-32"></div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-white/60 break-keep">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-white/40">
          참가자 27명 · 등록 미션 18개 · 포인트 로그 531건
        </p>
      </div>
    </section>
  );
}
