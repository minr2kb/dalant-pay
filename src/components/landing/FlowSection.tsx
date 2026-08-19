const USE_CASES = [
  "MT",
  "워크숍",
  "팀빌딩",
  "수련회",
  "컨퍼런스",
  "페스티벌",
  "상시 커뮤니티",
];

export function FlowSection() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm font-medium text-primary">
          오프라인 미션 인증 리워드
        </p>
        <h2 className="mt-2 text-balance break-keep text-2xl font-bold sm:text-3xl">
          미션을 하고, 인증받고, 포인트를 쓰는 것
        </h2>
        <p className="mt-6 text-gray-600 dark:text-gray-400 break-keep">
          회사 워크숍, 대학 MT, 페스티벌 스탬프 투어, 교회 달란트 시장까지,
          사람을 움직이게 만들고 싶은 자리라면 어디서든 쓰여온 방식입니다.
          <br />
          달란트페이는 미션 인증부터 포인트 적립, 마켓에서 쓰는 것까지 이 전체
          흐름을 스마트폰 하나로 연결합니다.
        </p>

        <p className="mt-14 text-sm font-medium text-gray-500 dark:text-gray-400">
          이런 자리를 기획·운영하는 분들을 위해 만들었습니다
        </p>
        <div className="relative mt-4 overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-2.5 hover:paused">
            {[...USE_CASES, ...USE_CASES].map((useCase, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 마퀴 연출을 위해 목록을 그대로 복제한 정적 배열이라 순서/개수가 바뀌지 않는다
                key={`${useCase}-${i}`}
                className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium dark:bg-gray-950 break-keep"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
