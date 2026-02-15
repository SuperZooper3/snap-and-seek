"use client";

import { useEffect, useState } from "react";

type Stats = { gamesPlayed: number; snapsTaken: number; playersJoined: number };

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function HomeStats() {
  const [stats, setStats] = useState<Stats>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Stats failed");
        return res.json();
      })
      .then((data: { gamesPlayed: number; snapsTaken: number; playersJoined: number }) =>
        setStats({
          gamesPlayed: data.gamesPlayed,
          snapsTaken: data.snapsTaken,
          playersJoined: data.playersJoined,
        })
      )
      .catch(() => {});
  }, []);

  if (stats === null) return null;

  return (
    <div
      className="flex flex-wrap justify-center items-baseline gap-x-8 gap-y-1 mt-4"
      style={{ color: "var(--pastel-ink-muted)" }}
    >
      <span className="flex items-baseline gap-2">
        <span
          className="text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {formatCount(stats.gamesPlayed)}
        </span>
        <span className="text-base sm:text-lg">games played</span>
      </span>
      <span className="flex items-baseline gap-2">
        <span
          className="text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {formatCount(stats.playersJoined)}
        </span>
        <span className="text-base sm:text-lg">players</span>
      </span>
      <span className="flex items-baseline gap-2">
        <span
          className="text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {formatCount(stats.snapsTaken)}
        </span>
        <span className="text-base sm:text-lg">snaps taken</span>
      </span>
    </div>
  );
}
