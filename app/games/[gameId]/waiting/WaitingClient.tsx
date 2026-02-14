"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";

type PlayerReadiness = {
  id: number;
  name: string;
  isReady: boolean;
};

type ReadinessResponse = {
  players: PlayerReadiness[];
  readyCount: number;
  totalCount: number;
  allReady: boolean;
};

type Props = {
  gameId: string;
  gameName: string;
  playerId: number;
  playerName: string;
};

export function WaitingClient({
  gameId,
  gameName,
  playerId,
  playerName,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const fetchReadiness = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}/readiness`);
      if (!res.ok) throw new Error("Failed to fetch readiness");
      const json: ReadinessResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Could not check player status");
    }
  }, [gameId]);

  useEffect(() => {
    fetchReadiness();
    setCountdown(3);

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchReadiness();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [fetchReadiness]);

  async function startSeeking() {
    setStarting(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "seeking" }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to start seeking");
      }
      router.push(`/games/${gameId}/seeking`);
    } catch (e) {
      setStarting(false);
      alert(e instanceof Error ? e.message : "Failed to start seeking");
    }
  }

  const readyCount = data?.readyCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const allReady = data?.allReady ?? false;
  const waitingCount = totalCount - readyCount;

  return (
    <div className="min-h-screen min-h-[100dvh] font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-lg px-4 py-8 pb-28">
        <header className="mb-8">
          <Link href={`/games/${gameId}/setup`} className="btn-ghost inline-flex items-center gap-1.5">
            <BackArrowIcon /> Back to setup
          </Link>
          <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {allReady ? "Everyone is ready!" : "Waiting for teams to finish setup…"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            {gameName} · Playing as <strong style={{ color: "var(--foreground)" }}>{playerName}</strong>
          </p>
        </header>

        <section className="sketch-card overflow-hidden">
          {data === null && !error && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              Loading players...
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--pastel-error)" }}>
              {error}
            </div>
          )}

          {data && (
            <ul className="divide-y-2" style={{ borderColor: "var(--pastel-border)" }}>
              {data.players.map((player) => {
                const isYou = player.id === playerId;
                return (
                  <li key={player.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2"
                        style={{
                          background: player.isReady ? "var(--pastel-mint)" : "var(--pastel-butter)",
                          borderColor: "var(--pastel-border)",
                          color: "var(--pastel-ink)",
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--pastel-ink)" }}>
                          {player.name}
                          {isYou && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--pastel-ink-muted)" }}>
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {player.isReady ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border-2"
                        style={{
                          background: "var(--pastel-mint)",
                          borderColor: "var(--pastel-border)",
                          color: "var(--pastel-ink)",
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border-2"
                        style={{
                          background: "var(--pastel-peach)",
                          borderColor: "var(--pastel-border)",
                          color: "var(--pastel-ink)",
                        }}
                      >
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                        </span>
                        Setting up
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {data && (
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              {allReady ? (
                <span className="font-bold" style={{ color: "var(--pastel-ink)" }}>
                  All {totalCount} players ready!
                </span>
              ) : (
                <>
                  Waiting for <strong>{waitingCount}/{totalCount}</strong> {waitingCount === 1 ? "player" : "players"}
                </>
              )}
            </p>
            <p className="text-xs tabular-nums" style={{ color: "var(--pastel-ink-muted)" }}>
              Refreshing in {countdown}s
            </p>
          </div>
        )}
      </main>

      <div
        className="fixed bottom-0 inset-x-0 px-4 py-4 font-sans"
        style={{ background: "var(--background)" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={startSeeking}
            disabled={!allReady || starting}
            className="btn-pastel-sky touch-manipulation w-full disabled:opacity-50 text-base"
          >
            {starting ? "Starting…" : "Start seeking!"}
          </button>
        </div>
      </div>
    </div>
  );
}
