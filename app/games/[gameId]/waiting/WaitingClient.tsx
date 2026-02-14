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

  // Poll every 3 seconds with visible countdown
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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-lg px-4 py-8 pb-28">
        {/* Header */}
        <header className="mb-8">
          <Link
            href={`/games/${gameId}/setup`}
            className="inline-flex items-center gap-1.5 text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
          >
            <BackArrowIcon /> Back to setup
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-amber-900 dark:text-amber-100">
            {allReady
              ? "Everyone is ready!"
              : "Waiting for teams to finish setup\u2026"}
          </h1>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {gameName} &middot; Playing as <strong>{playerName}</strong>
          </p>
        </header>

        {/* Player list */}
        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 overflow-hidden">
          {data === null && !error && (
            <div className="px-4 py-8 text-center text-amber-700 dark:text-amber-300 text-sm">
              Loading players...
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {data && (
            <ul className="divide-y divide-amber-100 dark:divide-zinc-700">
              {data.players.map((player) => {
                const isYou = player.id === playerId;
                return (
                  <li
                    key={player.id}
                    className="flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar circle */}
                      <div
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          player.isReady
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-zinc-700 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
                          {player.name}
                          {isYou && (
                            <span className="ml-1.5 text-xs font-normal text-amber-600 dark:text-amber-400">
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {player.isReady ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-zinc-700 px-2.5 py-1 rounded-full">
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

        {/* Counter + refresh countdown */}
        {data && (
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {allReady ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  All {totalCount} players ready!
                </span>
              ) : (
                <>
                  Waiting for{" "}
                  <strong>
                    {waitingCount}/{totalCount}
                  </strong>{" "}
                  {waitingCount === 1 ? "player" : "players"}
                </>
              )}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60 tabular-nums">
              Refreshing in {countdown}s
            </p>
          </div>
        )}
      </main>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-amber-50 via-amber-50 to-transparent dark:from-zinc-950 dark:via-zinc-950 px-4 py-4">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={startSeeking}
            disabled={!allReady || starting}
            className="touch-manipulation w-full rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 disabled:opacity-50 text-white font-semibold px-6 py-3.5 transition-colors shadow-lg text-base"
          >
            {starting ? "Starting\u2026" : "Start seeking!"}
          </button>
        </div>
      </div>
    </div>
  );
}
