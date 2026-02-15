"use client";

import { useState, useEffect, useMemo } from "react";
import { getLocation } from "@/lib/get-location";
import { distanceMeters } from "@/lib/map-utils";
import type { Hint } from "@/lib/types";

interface SeekingTarget {
  playerId: number;
  name: string;
  photoUrl: string | null;
}

interface Props {
  gameId: string;
  targetPlayer: SeekingTarget;
  onStartHint: (type: 'thermometer', initialData: Record<string, unknown>) => void;
  disabled: boolean;
  activeHint: Hint | undefined;
  powerupCastingSeconds: number;
  thermometerThresholdMeters: number;
  onHintCompleted?: (hint: Hint) => void;
  onCancel?: (hintId: string) => void;
}

function formatResult(result: string): string {
  if (result === 'same') return 'Neutral';
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function ThermometerPowerup({
  gameId,
  targetPlayer,
  onStartHint,
  disabled,
  activeHint,
  powerupCastingSeconds,
  thermometerThresholdMeters,
  onHintCompleted,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Start position comes from the active hint's note (so the start pin is that position)
  const startFromHint = useMemo(() => {
    if (!activeHint || activeHint.type !== 'thermometer' || !activeHint.note) return null;
    try {
      const note = JSON.parse(activeHint.note) as { startLat?: number; startLng?: number };
      if (typeof note.startLat === 'number' && typeof note.startLng === 'number') {
        return { lat: note.startLat, lng: note.startLng };
      }
    } catch {}
    return null;
  }, [activeHint?.id, activeHint?.note]);

  // Track distance from start while we have an active thermometer
  useEffect(() => {
    if (!startFromHint) {
      setCurrentDistance(null);
      return;
    }
    const update = () => {
      getLocation({ maximumAge: 0 })
        .then(({ latitude, longitude }) => {
          const d = distanceMeters(startFromHint.lat, startFromHint.lng, latitude, longitude);
          setCurrentDistance(Math.round(d));
        })
        .catch((err) => console.error('Location error:', err));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startFromHint]);

  const handleStart = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setDistanceError(null);
    setResult(null);
    try {
      const { latitude, longitude } = await getLocation();
      await onStartHint('thermometer', {
        startLat: latitude,
        startLng: longitude,
        thresholdMeters: thermometerThresholdMeters,
      });
    } catch (err) {
      console.error('Failed to get location:', err);
      setDistanceError('Could not get your location.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetResult = async () => {
    if (!activeHint || !startFromHint) return;
    if (currentDistance == null || currentDistance < thermometerThresholdMeters) return;

    setLoading(true);
    setDistanceError(null);
    setResult(null);
    try {
      const { latitude, longitude } = await getLocation({ maximumAge: 0 });

      const response = await fetch(`/api/games/${gameId}/thermometer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hintId: activeHint.id,
          currentLat: latitude,
          currentLng: longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error === 'Must move further' && typeof data.distanceFromStart === 'number' && typeof data.thresholdMeters === 'number') {
          setDistanceError(`You're ${data.distanceFromStart}m from start. Move at least ${data.thresholdMeters}m to get a result.`);
        } else {
          setDistanceError(data.error ?? 'Could not get result.');
        }
        return;
      }

      if (data.result) {
        setResult(formatResult(data.result));
        const patchRes = await fetch(`/api/games/${gameId}/hints/${activeHint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            resultData: { result: data.result, endLat: latitude, endLng: longitude },
          }),
        });
        const patchData = await patchRes.json();
        if (patchRes.ok && patchData.hint) {
          onHintCompleted?.(patchData.hint);
        }
      } else {
        setDistanceError(`Move at least ${data.thresholdMeters ?? thermometerThresholdMeters}m from start to get a result.`);
      }
    } catch (error) {
      console.error('Failed to get thermometer result:', error);
      setDistanceError('Could not get location or result.');
    } finally {
      setLoading(false);
    }
  };

  const canGetResult =
    activeHint &&
    activeHint.type === 'thermometer' &&
    startFromHint &&
    currentDistance != null &&
    currentDistance >= thermometerThresholdMeters;

  return (
    <div className="space-y-4">
      <p className="text-sm text-center" style={{ color: "var(--pastel-ink-muted)" }}>
        Get hotter/colder feedback after walking a certain distance from a starting point. 
        <br/>
        Cuts down the hider's possible locations.
      </p>

      {!activeHint ? (
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={disabled || loading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-lg"
          >
            {loading ? 'Getting location…' : 'Start Thermometer'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Distance from start</div>
            <div className="text-xl font-bold text-orange-600">
              {currentDistance != null
                ? `${currentDistance}m / ${thermometerThresholdMeters}m needed`
                : '…'}
            </div>
          </div>

          {distanceError && (
            <div className="text-center text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {distanceError}
            </div>
          )}

          <div className="text-center space-y-2">
            <button
              onClick={handleGetResult}
              disabled={loading || !canGetResult}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
            >
              {loading ? 'Getting result…' : canGetResult ? 'Get result' : `Walk ${thermometerThresholdMeters}m first`}
            </button>
            {onCancel && activeHint && (
              <div>
                <button
                  type="button"
                  onClick={() => onCancel(activeHint.id)}
                  className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div
          className="text-center p-4 rounded-lg border-2"
          style={{
            background:
              result === 'Hotter'
                ? 'rgba(185, 28, 28, 0.2)'
                : result === 'Colder'
                  ? 'rgba(14, 165, 233, 0.2)'
                  : 'var(--pastel-butter)',
            borderColor:
              result === 'Hotter'
                ? 'var(--pastel-error, #b91c1c)'
                : result === 'Colder'
                  ? 'var(--pastel-sky, #0ea5e9)'
                  : 'var(--pastel-border)',
          }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--pastel-ink, #1a1a1a)' }}>
            {result === 'Neutral'
              ? 'Neutral distance hasn\'t changed much 🌡️'
              : `You're getting ${result}! 🌡️`}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--pastel-ink-muted)' }}>
            Check the map for pins and history below.
          </p>
        </div>
      )}
    </div>
  );
}
