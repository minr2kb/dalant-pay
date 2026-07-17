"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

// 삼성 인터넷의 강제 다크모드는 SVG/CSS 색상엔 HSL lightness를 반전시키는
// 공격적인 보정을 걸지만, 비트맵 이미지에는 밝기를 30%가량 균일하게 낮추는
// 것만 적용한다 (참고: https://www.ctrl.blog/entry/samsung-internet-night-mode.html).
// 그래서 QR을 살아있는 SVG로 두는 대신 캔버스로 래스터화한 PNG로 바꿔 보여준다.
export function QRCodeImage({ value, size }: { value: string; size: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value/size aren't read directly, but the ref's rendered SVG only reflects a new value/size after those props re-render <QRCode>, so this must still re-run on either changing
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let cancelled = false;
    const scale = 2;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPngUrl(canvas.toDataURL("image/png"));
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <>
      {/* 숨김 스타일은 이 래퍼에만 건다 — QRCode(svg) 자체에 주면 그 style
          속성이 XMLSerializer로 그대로 복사되어, 래스터화용 원본 SVG가
          width:0/height:0로 저장돼 캔버스에 아무것도 안 그려진다. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <QRCode
          // biome-ignore lint/suspicious/noExplicitAny: react-qr-code ships a stale class-component ref type even though it's actually a forwardRef function component forwarding to the underlying <svg>
          ref={svgRef as any}
          value={value}
          size={size}
          // 다크모드로 뭉개진 저대비 촬영본에서도 스캔이 되도록 최고 오류
          // 정정 레벨(~30% 복구)로 여유를 둔다. 페이로드가 짧아 밀도는 낮음.
          level="H"
        />
      </div>
      {pngUrl ? (
        // biome-ignore lint/performance/noImgElement: rasterized data URI, not a build-time asset next/image can optimize
        <img src={pngUrl} width={size} height={size} alt="" />
      ) : (
        <div
          className="animate-pulse rounded-xl bg-gray-100"
          style={{ width: size, height: size }}
        />
      )}
    </>
  );
}
