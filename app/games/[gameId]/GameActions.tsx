"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameZoneModal } from "./GameZoneModal";
import { TutorialModal } from "@/components/TutorialModal";

type GameZone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
} | null;

type PlayerIdentity = { id: number; name: string } | null;

const HIDING_DURATION_PRESETS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "3 minutes", value: 180 },
  { label: "4 minutes", value: 240 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "20 minutes", value: 1200 },
] as const;

const POWERUP_CASTING_PRESETS = [
  { label: "10 seconds", value: 10 },
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "3 minutes", value: 180 },
  { label: "5 minutes", value: 300 },
] as const;

const THERMOMETER_THRESHOLD_PRESETS = [
  { label: "25 m", value: 25 },
  { label: "50 m", value: 50 },
  { label: "100 m", value: 100 },
  { label: "150 m", value: 150 },
  { label: "200 m", value: 200 },
] as const;

type Props = {
  gameId: string;
  status: string | null;
  joinUrl: string;
  playerCount: number;
  zone: GameZone;
  currentPlayer: PlayerIdentity;
  /** Hiding phase duration in seconds (see game-config). Only used in lobby. */
  hidingDurationSeconds: number;
  /** Power-up casting duration in seconds */
  powerupCastingSeconds: number;
  /** Thermometer distance threshold in meters */
  thermometerThresholdMeters: number;
};

export function GameActions({
  gameId,
  status,
  joinUrl,
  playerCount,
  zone,
  currentPlayer,
  hidingDurationSeconds,
  powerupCastingSeconds,
  thermometerThresholdMeters,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [savingCasting, setSavingCasting] = useState(false);
  const [savingThermometer, setSavingThermometer] = useState(false);
  const isLobby = status === "lobby";
  const hasZone = zone != null;
  const canStart = playerCount >= 2 && hasZone;

  function copyLink() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function startGame() {
    setStarting(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hiding" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start game");
      }
      router.push(`/games/${gameId}/zone`);
    } finally {
      setStarting(false);
    }
  }

  async function setHidingDuration(seconds: number) {
    setSavingDuration(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiding_duration_seconds: seconds }),
      });
      if (!res.ok) throw new Error("Failed to update duration");
      router.refresh();
    } finally {
      setSavingDuration(false);
    }
  }

  async function setPowerupCasting(seconds: number) {
    setSavingCasting(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerup_casting_duration_seconds: seconds }),
      });
      if (!res.ok) throw new Error("Failed to update cast time");
      router.refresh();
    } finally {
      setSavingCasting(false);
    }
  }

  async function setThermometerThreshold(meters: number) {
    setSavingThermometer(true);
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thermometer_threshold_meters: meters }),
      });
      if (!res.ok) throw new Error("Failed to update thermometer distance");
      router.refresh();
    } finally {
      setSavingThermometer(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-bold mb-1.5 text-[var(--foreground)]">
          Share this link for players to join
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={joinUrl}
            className="sketch-input flex-1 min-w-0 max-w-xl px-3 py-3 text-base min-h-[3rem] text-[var(--pastel-ink)]"
          />
          <button type="button" onClick={copyLink} className="btn-sm shrink-0 whitespace-nowrap">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {isLobby && (
        <>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="btn-pastel-sky touch-manipulation w-full min-h-[3.25rem] flex items-center justify-start gap-2 text-left px-4 py-3"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="min-w-0">
              How to play
              <br />
              <strong>Snap and Seek</strong>!
            </span>
          </button>
          <div>
            <label className="block text-base font-bold mb-1.5 text-[var(--foreground)]">
              Hiding period
            </label>
            <select
              value={hidingDurationSeconds}
              onChange={(e) => setHidingDuration(Number(e.target.value))}
              disabled={savingDuration}
              className="sketch-input w-full px-3 py-3 text-base min-h-[3rem] text-[var(--pastel-ink)]"
            >
              {HIDING_DURATION_PRESETS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-bold mb-1.5 text-[var(--foreground)]">
              Time to Cast
            </label>
            <select
              value={powerupCastingSeconds}
              onChange={(e) => setPowerupCasting(Number(e.target.value))}
              disabled={savingCasting}
              className="sketch-input w-full px-3 py-3 text-base min-h-[3rem] text-[var(--pastel-ink)]"
            >
              {POWERUP_CASTING_PRESETS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-sm text-[var(--pastel-ink-muted)] mt-1">
              How long power-ups take to cast during seeking
            </p>
          </div>
          <div>
            <label className="block text-base font-bold mb-1.5 text-[var(--foreground)]">
              Thermometer distance
            </label>
            <select
              value={THERMOMETER_THRESHOLD_PRESETS.some((p) => p.value === thermometerThresholdMeters) ? thermometerThresholdMeters : 50}
              onChange={(e) => setThermometerThreshold(Number(e.target.value))}
              disabled={savingThermometer}
              className="sketch-input w-full px-3 py-3 text-base min-h-[3rem] text-[var(--pastel-ink)]"
            >
              {THERMOMETER_THRESHOLD_PRESETS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-sm text-[var(--pastel-ink-muted)] mt-1">
              Minimum distance to move from start to complete thermometer hint
            </p>
          </div>
          <button
            type="button"
            onClick={() => setZoneModalOpen(true)}
            className="btn-pastel-peach touch-manipulation w-full"
          >
            {hasZone ? "Edit game zone" : "Set game zone"}
          </button>
          {!hasZone && (
            <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              Set the play area on the map (required to start).
            </p>
          )}
          {!canStart && hasZone && (
            <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              Need at least 2 players to start.
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            disabled={starting || !canStart}
            className="btn-primary touch-manipulation w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? "Starting…" : "Start game"}
          </button>
        </>
      )}

      {zoneModalOpen && (
        <GameZoneModal
          gameId={gameId}
          initialZone={zone}
          onSaved={() => {
            setZoneModalOpen(false);
            router.refresh();
          }}
          onClose={() => setZoneModalOpen(false)}
        />
      )}

      {tutorialOpen && (
        <TutorialModal onClose={() => setTutorialOpen(false)} />
      )}

      {!isLobby && status && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              Status
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border-2"
              style={{
                borderColor: "var(--pastel-border)",
                background:
                  status === "completed"
                    ? "var(--pastel-mint)"
                    : status === "hiding"
                      ? "var(--pastel-mint)"
                      : status === "seeking"
                        ? "var(--pastel-sky)"
                        : "var(--pastel-peach)",
                color: "var(--pastel-ink)",
              }}
            >
              {status}
            </span>
          </div>
          {status === "completed" ? (
            <a
              href={`/games/${gameId}/summary`}
              className="btn-pastel-mint touch-manipulation block w-full text-center"
            >
              View game summary
            </a>
          ) : currentPlayer ? (
            <a
              href={status === "seeking" ? `/games/${gameId}/seeking` : `/games/${gameId}/zone`}
              className="btn-primary touch-manipulation block w-full text-center"
            >
              {status === "seeking" ? "Go to seeking" : "Go to hiding"}
            </a>
          ) : (
            <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
              {status === "seeking"
                ? "Seeking in progress join as a player to view the seeking map."
                : "Join as a player below (tap a name) to start hiding."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
