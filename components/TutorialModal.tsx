"use client";

import { useEffect } from "react";
import { GameTutorial } from "./GameTutorial";

type Props = {
  onClose: () => void;
};

export function TutorialModal({ onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.4)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="sketch-card max-h-[90vh] w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-[3px]" style={{ borderColor: "var(--pastel-border)" }}>
          <h2 id="tutorial-title" className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            How to play <strong>Snap and Seek</strong>?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 border-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5"
            style={{ borderColor: "var(--pastel-border)", background: "var(--pastel-paper)", color: "var(--pastel-ink)" }}
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <GameTutorial showTitle={false} />
        </div>
        <div className="p-4 border-t-[3px]" style={{ borderColor: "var(--pastel-border)" }}>
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
}
