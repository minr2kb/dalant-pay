"use client";

import { useEffect } from "react";

// 무한 루프 마퀴 — 콘텐츠가 정확히 2배로 복제되어 있다고 가정하고, scrollLeft가
// 절반을 넘으면 되감아 이음매 없이 반복한다. 네이티브 스크롤 컨테이너를 그대로
// 쓰기 때문에 드래그/터치 스크롤은 브라우저가 처리하고, 여기선 포인터가 눌려있는
// 동안만 자동 스크롤을 멈췄다가 뗀 뒤 잠깐 쉬고 재개한다.
export function useAutoScroll(
  ref: React.RefObject<HTMLElement | null>,
  // speed는 px/frame이 아니라 px/초 — 프레임레이트(60Hz/120Hz 등)에 따라
  // 체감 속도가 달라지는 걸 막는다.
  { speed = 30, resumeDelayMs = 1200, enabled = true } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number;
    let paused = false;
    let lastTime: number | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      if (!paused && lastTime !== null) {
        const deltaSec = (now - lastTime) / 1000;
        const half = el.scrollWidth / 2;
        el.scrollLeft += speed * deltaSec;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      lastTime = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => {
      paused = true;
      clearTimeout(resumeTimer);
    };
    const resumeSoon = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, resumeDelayMs);
    };

    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resumeSoon);
    el.addEventListener("pointercancel", resumeSoon);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resumeSoon);
      el.removeEventListener("pointercancel", resumeSoon);
    };
  }, [ref, speed, resumeDelayMs, enabled]);
}
