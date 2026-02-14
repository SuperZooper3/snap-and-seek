"use client";

import { useEffect, useState, useRef } from "react";

type Props = {
  hidingStartedAt: string | null;
  hidingDurationSeconds: number;
  variant?: "bar" | "pill";
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync null when no start time
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
        className="rounded-full border-[3px] px-5 py-2.5 font-bold tabular-nums text-lg"
        style={{
          background: isZero ? "var(--pastel-error)" : "var(--pastel-mint)",
          borderColor: "var(--pastel-border)",
          color: "var(--pastel-ink)",
          boxShadow: "4px 4px 0 var(--pastel-border-subtle)",
        }}
        aria-live="polite"
      >
        {formatRemaining(remainingSeconds)}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex flex-col items-center justify-center gap-0.5 border-b-[3px] px-4 py-3"
      style={{
        borderColor: "var(--pastel-border)",
        background: "var(--pastel-mint)",
      }}
    >
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--pastel-ink-muted)" }}>
        Time remaining
      </span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--pastel-ink)" }} aria-live="polite">
        {formatRemaining(remainingSeconds)}
      </span>
    </div>
  );
}
