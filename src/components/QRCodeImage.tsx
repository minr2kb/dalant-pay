"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

// QR 스펙 권장 최소 여백(quiet zone) — 모듈 4개 폭.
const QUIET_ZONE_MODULES = 4;

export function QRCodeImage({ value, size }: { value: string; size: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [quietZonePx, setQuietZonePx] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value isn't read directly, but the ref's rendered SVG only reflects a new value after it re-renders <QRCode>, so this must still re-run when value changes
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // moduleCount는 react-qr-code가 viewBox="0 0 N N"으로 그대로 노출한다 —
    // 페이로드 길이에 따라 QR 버전이 달라져도 여백 비율이 항상 스펙에 맞게
    // 자동으로 맞춰지도록, 고정 픽셀이 아니라 이 값으로 여백을 계산한다.
    const moduleCount = svg.viewBox.baseVal.width || 1;
    const moduleSize = size / (moduleCount + QUIET_ZONE_MODULES * 2);
    setQuietZonePx(moduleSize * QUIET_ZONE_MODULES);
  }, [value, size]);

  return (
    <div
      className="flex items-center justify-center bg-white"
      style={{ width: size, height: size, padding: quietZonePx }}
    >
      <QRCode
        // biome-ignore lint/suspicious/noExplicitAny: react-qr-code ships a stale class-component ref type even though it's actually a forwardRef function component forwarding to the underlying <svg>
        ref={svgRef as any}
        value={value}
        size={size - quietZonePx * 2}
        // 다크모드로 뭉개진 저대비 촬영본에서도 스캔이 되도록 최고 오류
        // 정정 레벨(~30% 복구)로 여유를 둔다. 페이로드가 짧아 밀도는 낮음.
        level="H"
      />
    </div>
  );
}
