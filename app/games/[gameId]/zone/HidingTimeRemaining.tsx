"use client";

import { useEffect, useState } from "react";

type Props = {
  hidingStartedAt: string | null;
  hidingDurationSeconds: number;
};

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HidingTimeRemaining({
  hidingStartedAt,
  hidingDurationSeconds,
}: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!hidingStartedAt) {
      setRemainingSeconds(null);
      return;
    }
    const started = new Date(hidingStartedAt).getTime();
    const durationMs = hidingDurationSeconds * 1000;

    const tick = () => {
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setRemainingSeconds(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hidingStartedAt, hidingDurationSeconds]);

  if (remainingSeconds === null) return null;

  return (
    <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 bg-emerald-500/20 dark:bg-emerald-900/30 border-b border-emerald-300/50 dark:border-emerald-700/50 px-4 py-3">
      <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
        Time remaining
      </span>
      <span
        className="text-2xl font-mono font-bold tabular-nums text-emerald-900 dark:text-emerald-100"
        aria-live="polite"
      >
        {formatRemaining(remainingSeconds)}
      </span>
    </div>
  );
}
