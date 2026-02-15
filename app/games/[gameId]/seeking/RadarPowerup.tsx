"use client";

import { useState, useEffect } from "react";
import { getLocation } from "@/lib/get-location";

const RADAR_DISTANCES = [10, 25, 50, 75, 100, 150, 200, 500];

interface SeekingTarget {
  playerId: number;
  name: string;
  photoUrl: string | null;
}

interface Props {
  gameId: string;
  targetPlayer: SeekingTarget;
  onStartHint: (type: 'radar', initialData: Record<string, unknown>) => void;
  disabled: boolean;
  powerupCastingSeconds: number;
  lastResult?: { note: string | null };
  /** Called when the selected distance changes so the map can show a dotted preview circle */
  onSelectedDistanceChange?: (meters: number) => void;
}

export function RadarPowerup({
  gameId,
  targetPlayer,
  onStartHint,
  disabled,
  powerupCastingSeconds,
  lastResult,
  onSelectedDistanceChange,
}: Props) {
  const [distanceIndex, setDistanceIndex] = useState(2); // Default to 50m
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onSelectedDistanceChange?.(RADAR_DISTANCES[distanceIndex]);
  }, [distanceIndex, onSelectedDistanceChange]);

  const handleCastRadar = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      // Get current location (uses debug cookie if in debug mode)
      const { latitude: lat, longitude: lng } = await getLocation();
      const distanceMeters = RADAR_DISTANCES[distanceIndex];

      // Start the hint with initial data
      await onStartHint('radar', {
        distanceMeters,
        lat,
        lng,
      });
    } catch (error) {
      console.error('Failed to get location or start radar:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDistance = RADAR_DISTANCES[distanceIndex];

  let lastYesNo: boolean | null = null;
  if (lastResult?.note) {
    try {
      const d = JSON.parse(lastResult.note);
      if (d?.result?.withinDistance === true || d?.result?.withinDistance === false) {
        lastYesNo = d.result.withinDistance;
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-center" style={{ color: "var(--pastel-ink-muted)" }}>
        Check if you&apos;re within a certain distance of {targetPlayer.name}&apos;s hiding spot
      </div>

      {/* Distance stepper */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={() => setDistanceIndex(Math.max(0, distanceIndex - 1))}
          disabled={distanceIndex === 0 || disabled}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--pastel-butter)", borderColor: "var(--pastel-border)" }}
        >
          −
        </button>
        
        <div className="text-center min-w-[80px]">
          <div className="text-lg font-semibold" style={{ color: "var(--pastel-ink)" }}>{selectedDistance}m</div>
        </div>
        
        <button
          onClick={() => setDistanceIndex(Math.min(RADAR_DISTANCES.length - 1, distanceIndex + 1))}
          disabled={distanceIndex === RADAR_DISTANCES.length - 1 || disabled}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--pastel-butter)", borderColor: "var(--pastel-border)" }}
        >
          +
        </button>
      </div>

      {/* Cast button */}
      <div className="text-center">
        <button
          onClick={handleCastRadar}
          disabled={disabled || loading}
          className="btn-pastel-sky w-full touch-manipulation"
        >
          {loading ? 'Getting location...' : `Cast Radar (${powerupCastingSeconds}s)`}
        </button>
      </div>

      {/* Inline result */}
      {lastYesNo !== null && (
        <div
          className="text-center text-lg font-bold"
          style={{ color: "var(--pastel-ink)" }}
        >
          {lastYesNo ? "Yes — you're within range." : "No — you're not within range."}
        </div>
      )}

      <div className="text-xs text-center" style={{ color: "var(--pastel-ink-muted)" }}>
        Takes {powerupCastingSeconds} seconds to cast
      </div>
    </div>
  );
}