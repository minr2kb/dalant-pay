"use client";

import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Modal({ children, onClose, className = "" }: ModalProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop click-to-close is a mouse convenience; every modal (see openModal/history.back) also closes via the browser back gesture, which is the keyboard/AT-accessible path
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 animate-in fade-in duration-200 ${className}`}
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: stops the backdrop's onClose from firing when tapping the modal content itself, not an interactive action of its own */}
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 fade-in duration-200 ease-out max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
