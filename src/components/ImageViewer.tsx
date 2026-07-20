"use client";

import { X } from "lucide-react";
import { openModal } from "@/lib/overlay";

function ImageViewerContent({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop click-to-close is a mouse convenience; every modal (see openModal/history.back) also closes via the browser back gesture, which is the keyboard/AT-accessible path
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 text-white/80 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>
      {/** biome-ignore lint/performance/noImgElement: full-size viewer, not a thumbnail */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: stops the backdrop's onClose from firing when tapping the image itself, not an interactive action of its own */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function openImageViewer(url: string) {
  openModal((close) => <ImageViewerContent url={url} onClose={close} />);
}
