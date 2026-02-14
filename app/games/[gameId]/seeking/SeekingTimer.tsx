"use client";

import { useEffect, useState } from "react";

type Props = {
  seekingStartedAt: string | null;
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
        className="rounded-full border-[3px] px-5 py-2.5 font-bold tabular-nums text-lg"
        style={{
          background: "var(--pastel-sky)",
          borderColor: "var(--pastel-border)",
          color: "var(--pastel-ink)",
          boxShadow: "4px 4px 0 var(--pastel-border-subtle)",
        }}
        aria-live="polite"
      >
        {formatElapsed(elapsedSeconds)}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex flex-col items-center justify-center gap-0.5 border-b-[3px] px-4 py-3"
      style={{
        borderColor: "var(--pastel-border)",
        background: "var(--pastel-sky)",
      }}
    >
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--pastel-ink-muted)" }}>
        Seeking time
      </span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--pastel-ink)" }} aria-live="polite">
        {formatElapsed(elapsedSeconds)}
      </span>
    </div>
  );
}
