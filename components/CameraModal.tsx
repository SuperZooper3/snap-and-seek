"use client";

import { useCallback } from "react";
import { CameraCapture } from "@/components/CameraCapture";

type CameraModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
};

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const handleCapture = useCallback(
    (blob: Blob) => {
      // Close first so the camera view is not shown again during upload
      onClose();
      onCapture(blob);
    },
    [onCapture, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col font-sans" style={{ background: "var(--pastel-ink)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b-2" style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)" }}>
        <span className="text-sm font-bold" style={{ color: "var(--pastel-ink)" }}>
          Take Photo
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all touch-manipulation"
          style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-butter)", color: "var(--pastel-ink)" }}
          aria-label="Close camera"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <CameraCapture autoStart fullScreen onCapture={handleCapture} />
      </div>
    </div>
  );
}
