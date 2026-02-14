"use client";

import { useEffect, useState, useRef } from "react";

type Props = {
  hidingStartedAt: string | null;
  hidingDurationSeconds: number;
  /** "pill" = floating pill on map (turns red at 0); default = bar above map */
  variant?: "bar" | "pill";
  /** Called once when remaining time first hits 0 */
  onTimeUp?: () => void;
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
  variant = "bar",
  onTimeUp,
}: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const timeUpFiredRef = useRef(false);

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

  useEffect(() => {
    if (remainingSeconds === 0 && onTimeUp && !timeUpFiredRef.current) {
      timeUpFiredRef.current = true;
      onTimeUp();
    }
  }, [remainingSeconds, onTimeUp]);

  if (remainingSeconds === null) return null;

  const isZero = remainingSeconds <= 0;

  if (variant === "pill") {
    return (
      <div
        className={
          isZero
            ? "rounded-full bg-red-500/95 dark:bg-red-600/95 backdrop-blur-md px-5 py-2.5 shadow-lg border border-red-400/50"
            : "rounded-full bg-emerald-500/90 dark:bg-emerald-600/90 backdrop-blur-md px-5 py-2.5 shadow-lg border border-emerald-400/50 dark:border-emerald-300/30"
        }
        aria-live="polite"
      >
        <span className="text-lg font-mono font-bold tabular-nums text-white">
          {formatRemaining(remainingSeconds)}
        </span>
      </div>
    );
  }

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
