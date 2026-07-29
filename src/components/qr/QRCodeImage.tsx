"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Skeleton } from "@/components/ui/skeleton";

// QR 스펙 권장 최소 여백(quiet zone) — 모듈 4개 폭.
const QUIET_ZONE_MODULES = 4;

// 실제 기기에서 확인된 사실: 삼성 인터넷 강제 다크모드는 눈으로 보기엔 살아있는
// SVG나 래스터화한 PNG나 똑같이 뿌옇게 보이지만, 실제 스캔 성공 여부는 다르다 —
// PNG로 바꿨을 때만 관리자 스캔(jsQR)이 성공했다. 시각적으로 구분이 안 될 뿐
// 대비가 덜 파괴되는 것으로 보여, SVG 대신 캔버스로 래스터화한 PNG를 보여준다.
export function QRCodeImage({ value, size }: { value: string; size: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value/size aren't read directly, but the ref's rendered SVG only reflects a new value/size after those props re-render <QRCode>, so this must still re-run on either changing
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let cancelled = false;
    const scale = 2;
    // moduleCount는 react-qr-code가 viewBox="0 0 N N"으로 그대로 노출한다 —
    // 페이로드 길이에 따라 QR 버전이 달라져도 여백 비율이 항상 스펙에 맞게
    // 자동으로 맞춰지도록, 고정 픽셀이 아니라 이 값으로 여백을 계산한다.
    const moduleCount = svg.viewBox.baseVal.width || 1;
    const moduleSize = size / (moduleCount + QUIET_ZONE_MODULES * 2);
    const quietZonePx = moduleSize * QUIET_ZONE_MODULES;
    const qrPixelSize = size - quietZonePx * 2;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        quietZonePx * scale,
        quietZonePx * scale,
        qrPixelSize * scale,
        qrPixelSize * scale,
      );
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
          // Verified this can't be narrowed further: QRCodeProps extends React.SVGProps<SVGSVGElement>
          // (which carries its own ref: Ref<SVGSVGElement>) while QRCode is *also* declared as
          // `class QRCode extends React.Component<QRCodeProps, any>` (ref: Ref<QRCode>) — JSX
          // intersects both, so no ref type satisfies the declared prop short of `any`. At runtime
          // this is actually a forwardRef straight to the <svg>, matching svgRef's real type.
          // biome-ignore lint/suspicious/noExplicitAny: see above — the lib's own .d.ts makes any other ref type unsatisfiable here
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
        <Skeleton
          className="rounded-xl dark:bg-gray-100"
          style={{ width: size, height: size }}
        />
      )}
    </>
  );
}
