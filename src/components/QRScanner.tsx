"use client";

import jsQR from "jsqr";
import { ChevronLeft, QrCode } from "lucide-react";
import { Children, type ReactNode, useEffect, useRef, useState } from "react";

// 삼성 인터넷 강제 다크모드 등으로 촬영본의 흑백 대비가 좁은 회색 대역으로
// 눌린 경우, 관측된 밝기 범위를 0~255로 다시 늘려 펴준다 — 대비가 거의 없는
// 프레임(진짜 빈 화면 등)은 range가 작아 나눗셈이 튀므로 그대로 둔다.
function stretchContrast(imageData: ImageData) {
  const { data } = imageData;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }
  const range = max - min;
  if (range < 10) return;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = ((data[i] - min) / range) * 255;
    data[i + 1] = ((data[i + 1] - min) / range) * 255;
    data[i + 2] = ((data[i + 2] - min) / range) * 255;
  }
}

// 대비 스트레칭으로도 안 되면 마지막 단계로 완전 이진화한다. 오츠 알고리즘은
// 명암 히스토그램에서 흑/백 두 무리를 가장 잘 가르는 기준값을 자동으로 찾아서
// 단순 선형 스트레칭보다 좁게 눌린 대비에도 더 공격적으로 대응한다.
function otsuBinarize(imageData: ImageData) {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    histogram[lum]++;
  }

  let sumAll = 0;
  for (let t = 0; t < 256; t++) sumAll += t * histogram[t];

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;
    const weightForeground = pixelCount - weightBackground;
    if (weightForeground === 0) break;
    sumBackground += t * histogram[t];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumAll - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) ** 2;
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const v = lum > threshold ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

interface QRScannerProps {
  open: boolean;
  title: string;
  hint?: string;
  badge?: ReactNode;
  onScan: (value: string) => void;
  onClose: () => void;
  children?: ReactNode;
}

export function QRScanner({
  open,
  title,
  hint,
  badge,
  onScan,
  onClose,
  children,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Children.toArray filters out null/undefined/boolean — {false}{false} → []
  // Children.count does NOT filter them (false counts as 1), so use toArray here
  const hasOverlay = Children.toArray(children).length > 0;
  const shouldScan = open && !hasOverlay;

  useEffect(() => {
    if (!shouldScan) {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => {
        t.stop();
      });
      streamRef.current = null;
      setCameraReady(false);
      setCameraError(false);
      return;
    }

    let active = true;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;

    function scanFrame() {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let code = jsQR(img.data, img.width, img.height);
          if (!code?.data) {
            stretchContrast(img);
            code = jsQR(img.data, img.width, img.height);
          }
          if (!code?.data) {
            otsuBinarize(img);
            code = jsQR(img.data, img.width, img.height);
          }
          if (code?.data) {
            onScanRef.current(code.data);
            // If onScan led to an overlay/close, this effect's cleanup runs
            // (deps change) and clears this timer before it fires. Otherwise
            // (invalid QR, rejected user, etc.) scanning resumes on its own —
            // the camera must never appear to "freeze" after a rejected scan.
            resumeTimer = setTimeout(() => {
              if (active) scanFrame();
            }, 1200);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
          },
        });
        if (!active) {
          stream.getTracks().forEach((t) => {
            t.stop();
          });
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!active) return;
        setCameraReady(true);
        scanFrame();
      } catch {
        if (active) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      active = false;
      clearTimeout(resumeTimer);
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => {
        t.stop();
      });
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [shouldScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center px-4 pt-14">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="ml-3 text-sm font-semibold text-white">{title}</p>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>

      {hasOverlay ? (
        children
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-64 w-64 overflow-hidden rounded-3xl">
              <video
                ref={videoRef}
                className={`h-full w-full object-cover transition-opacity duration-300 ${cameraReady ? "opacity-100" : "opacity-0"}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-white/40" />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-white/20" />
                </div>
              )}
            </div>

            {hint && <p className="text-sm text-white/60">{hint}</p>}

            {cameraReady && !cameraError && (
              <p className="animate-pulse text-xs text-white/40">
                QR 코드를 인식하는 중…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
