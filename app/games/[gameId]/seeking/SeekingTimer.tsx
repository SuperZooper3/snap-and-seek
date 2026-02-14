"use client";

import { useEffect, useState } from "react";

type Props = {
  seekingStartedAt: string | null;
  /** "pill" = compact floating pill (dynamic island style); default = bar */
  variant?: "bar" | "pill";
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SeekingTimer({ seekingStartedAt, variant = "bar" }: Props) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!seekingStartedAt) return;
    const started = new Date(seekingStartedAt).getTime();

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seekingStartedAt]);

  if (variant === "pill") {
    return (
      <div
        className="rounded-full bg-sky-500/90 dark:bg-sky-600/90 backdrop-blur-md px-5 py-2.5 shadow-lg border border-sky-400/50 dark:border-sky-300/30"
        aria-live="polite"
      >
        <span className="text-lg font-mono font-bold tabular-nums text-white">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="shrink-0 flex flex-col items-center justify-center gap-0.5 bg-sky-500/20 dark:bg-sky-900/30 border-b border-sky-300/50 dark:border-sky-700/50 px-4 py-3">
      <span className="text-xs font-medium text-sky-800 dark:text-sky-200 uppercase tracking-wide">
        Seeking time
      </span>
      <span
        className="text-2xl font-mono font-bold tabular-nums text-sky-900 dark:text-sky-100"
        aria-live="polite"
      >
        {formatElapsed(elapsedSeconds)}
      </span>
    </div>
  );
}
