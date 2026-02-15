"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getLocation, type LocationResult } from "@/lib/get-location";
import { setPlayerInCookie } from "@/lib/player-cookie";
import { addGameToYourGames } from "@/lib/your-games-cookie";

const ACCURACY_THRESHOLD_M = 10;

type LocationState =
  | null
  | { status: "fetching" }
  | { status: "success"; data: LocationResult }
  | { status: "error"; message: string }
  | { status: "bad_accuracy"; data: LocationResult };

type Props = { gameId: string; isRejoin?: boolean };

export function JoinForm({ gameId, isRejoin = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>(null);

  const hasGoodLocation =
    locationState?.status === "success" &&
    locationState.data.accuracy <= ACCURACY_THRESHOLD_M;
  const hasBadAccuracy =
    (locationState?.status === "success" || locationState?.status === "bad_accuracy") &&
    locationState.data.accuracy > ACCURACY_THRESHOLD_M;

  async function requestLocation() {
    setLocationState({ status: "fetching" });
    setError(null);
    try {
      const data = await getLocation();
      if (data.accuracy > ACCURACY_THRESHOLD_M) {
        setLocationState({ status: "bad_accuracy", data });
      } else {
        setLocationState({ status: "success", data });
      }
    } catch (err) {
      setLocationState({
        status: "error",
        message: err instanceof Error ? err.message : "Could not get location.",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      addGameToYourGames(gameId);
      setPlayerInCookie(gameId, { id: data.id, name: data.name });
      router.push(`/games/${gameId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>
        {isRejoin
          ? "Enter the name you used when you joined"
          : "Your name"}
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Alex"
        required
        className="sketch-input w-full px-4 py-3 text-base"
        style={{ color: "var(--pastel-ink)" }}
        autoFocus
      />

      {/* Location step: only for new joins */}
      {!isRejoin && (
        <div className="mt-4">
          <p className="text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Check location
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--pastel-ink-muted)" }}>
            We need to confirm your location works and see your accuracy before you join.
          </p>
          {locationState?.status === "error" && (
            <p className="text-sm mb-2 font-medium" style={{ color: "#991b1b" }}>
              {locationState.message}
            </p>
          )}
          {hasBadAccuracy && (
            <p className="text-sm mb-2" style={{ color: "var(--pastel-ink-muted)" }}>
              Accuracy over 10 m. Try again for a better reading.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationState?.status === "fetching"}
              className={`shrink-0 min-w-[10.5rem] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
                hasGoodLocation
                  ? "btn-pastel-mint"
                  : hasBadAccuracy
                    ? "btn-pastel-orange"
                    : "btn-pastel-sky"
              }`}
            >
              {locationState?.status === "fetching"
                ? "Trying again…"
                : locationState?.status === "success"
                  ? `Good (${Math.round(locationState.data.accuracy)} m)`
                  : locationState?.status === "bad_accuracy"
                    ? `Poor (${Math.round(locationState.data.accuracy)} m)`
                    : locationState?.status === "error"
                      ? "Try again"
                      : "Enable location"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary shrink-0 disabled:opacity-50"
            >
              {loading ? "Joining" : "Join"}
            </button>
          </div>
        </div>
      )}

      {isRejoin && (
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-50"
        >
          {loading ? "Rejoining…" : "Rejoin"}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--pastel-error)" }}>{error}</p>
      )}
    </form>
  );
}
