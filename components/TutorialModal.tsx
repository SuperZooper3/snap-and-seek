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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl shadow-xl border border-amber-200/50 dark:border-zinc-700 max-h-[90vh] w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-amber-200/50 dark:border-zinc-700">
          <h2 id="tutorial-title" className="text-lg font-bold text-amber-900 dark:text-amber-100">
            How to play <strong>Snap and Seek</strong>!
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-zinc-700 transition-colors"
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
        <div className="p-4 border-t border-amber-200/50 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-6 py-3 transition-colors"
          >
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
}
