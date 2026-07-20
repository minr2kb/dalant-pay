"use client";

import { useEffect, useRef } from "react";

export function NumberTicker({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const from = prev.current;
    prev.current = value;
    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      if (!ref.current) return;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      ref.current.textContent = Math.round(
        from + (value - from) * eased,
      ).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
