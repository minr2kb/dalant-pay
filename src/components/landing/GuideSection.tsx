import { ProcessTabs } from "./ProcessTabs";

export function GuideSection() {
  return (
    <section id="guide" className="scroll-mt-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-center text-sm font-medium text-primary">
          이용 안내
        </p>
        <h2 className="mt-2 text-balance text-center text-2xl font-bold sm:text-3xl">
          참가자와 운영진, 이렇게 사용합니다
        </h2>
        <div className="mt-14">
          <ProcessTabs />
        </div>
      </div>
    </section>
  );
}
