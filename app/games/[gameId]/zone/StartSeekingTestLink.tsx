"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { gameId: string };

export function StartSeekingTestLink({ gameId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startSeeking() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "seeking" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start seeking");
      }
      router.push(`/games/${gameId}/seeking`);
    } catch (e) {
      setLoading(false);
      alert(e instanceof Error ? e.message : "Failed to start seeking");
    }
  }

  return (
    <button
      type="button"
      onClick={startSeeking}
      disabled={loading}
      className="touch-manipulation block w-full rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold px-6 py-3 text-center transition-colors border border-sky-500/50"
    >
      {loading ? "Starting…" : "Start seeking (test)"}
    </button>
  );
}
