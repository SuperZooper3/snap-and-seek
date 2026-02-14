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
      onCapture(blob);
      onClose();
    },
    [onCapture, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header bar with close button */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white text-sm font-medium">Take Photo</span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Close camera"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Camera fills the remaining space — h-full so CameraCapture can
          use flex layout to pin controls at the bottom */}
      <div className="flex-1 min-h-0">
        <CameraCapture
          autoStart
          fullScreen
          onCapture={handleCapture}
        />
      </div>
    </div>
  );
}
