"use client";

import { useState, useEffect } from "react";
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
  lastCompletedHint?: { note: string | null } | null;
  onHintCompleted?: (hint: Hint) => void;
}

function formatThermometerResult(result: string): string {
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
  lastCompletedHint,
  onHintCompleted,
}: Props) {
  const [startPoint, setStartPoint] = useState<{lat: number, lng: number} | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [thermometerResult, setThermometerResult] = useState<string | null>(null);

  // Track current location and distance from start when thermometer is active
  // Uses getLocation() so debug mode (sas_debug_location cookie) affects the distance
  useEffect(() => {
    if (!activeHint || activeHint.type !== 'thermometer' || !startPoint) return;

    const updateLocation = () => {
      getLocation()
        .then(({ latitude, longitude }) => {
          const distance = distanceMeters(startPoint.lat, startPoint.lng, latitude, longitude);
          setCurrentDistance(Math.round(distance));
        })
        .catch((err) => console.error('Location error:', err));
    };

    updateLocation();
    const interval = setInterval(updateLocation, 1000); // Every 1s so debug mode changes reflect quickly
    return () => clearInterval(interval);
  }, [activeHint, startPoint]);

  const handleSetStartPoint = async () => {
    setLoading(true);
    try {
      const { latitude: lat, longitude: lng } = await getLocation();
      setStartPoint({ lat, lng });
    } catch (err) {
      console.error('Failed to get location:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartThermometer = async () => {
    if (!startPoint || disabled || loading) return;

    setThermometerResult(null); // Clear previous result for clean reuse
    await onStartHint('thermometer', {
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      thresholdMeters: thermometerThresholdMeters,
    });
  };

  const handleStopThermometer = async () => {
    if (!activeHint || !startPoint) return;

    setLoading(true);
    try {
      const { latitude, longitude } = await getLocation();

      // Call thermometer API to get result
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
      if (response.ok && data.result) {
        setThermometerResult(formatThermometerResult(data.result));
        const patchRes = await fetch(`/api/games/${gameId}/hints/${activeHint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            resultData: { result: data.result },
          }),
        });
        const patchData = await patchRes.json();
        if (patchRes.ok && patchData.hint) {
          onHintCompleted?.(patchData.hint);
        }
      }
    } catch (error) {
      console.error('Failed to stop thermometer:', error);
    } finally {
      setLoading(false);
    }
  };

  const canStart = startPoint && !activeHint && !disabled;

  // Stop button: require BOTH cast time complete AND distance moved
  const isCastingComplete = activeHint
    ? Date.now() >= new Date(activeHint.created_at).getTime() + (activeHint.casting_duration_seconds || 0) * 1000
    : false;
  const canStop =
    activeHint &&
    activeHint.type === 'thermometer' &&
    isCastingComplete &&
    currentDistance != null &&
    currentDistance >= thermometerThresholdMeters;

  let lastResultDisplay: string | null = null;
  if (lastCompletedHint?.note) {
    try {
      const d = JSON.parse(lastCompletedHint.note);
      if (d.result) lastResultDisplay = formatThermometerResult(d.result);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      {lastResultDisplay && (
        <div className="text-center text-xs text-orange-600/70 dark:text-orange-400/70">
          Last result: {lastResultDisplay}
        </div>
      )}
      <div className="text-sm text-gray-600 text-center">
        Set a starting point, move away, then get &quot;hotter/colder/neutral&quot; feedback
      </div>

      {/* Step 1: Set starting point */}
      {!startPoint ? (
        <div className="text-center">
          <button
            onClick={handleSetStartPoint}
            disabled={loading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg"
          >
            {loading ? 'Getting location...' : 'Set Starting Point'}
          </button>
        </div>
      ) : (
        <div className="text-center text-green-600 text-sm">
          ✓ Starting point set
          <button
            onClick={() => setStartPoint(null)}
            className="ml-2 text-gray-500 hover:text-gray-700 text-xs underline"
          >
            reset
          </button>
        </div>
      )}

      {startPoint && (
        <div className="text-sm text-gray-600 text-center">
          Move at least {thermometerThresholdMeters}m away to complete
        </div>
      )}

      {/* Step 2: Start thermometer or show status */}
      {startPoint && !activeHint && (
        <div className="text-center">
          <button
            onClick={handleStartThermometer}
            disabled={disabled}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
          >
            Start Thermometer ({powerupCastingSeconds}s)
          </button>
        </div>
      )}

      {/* Show current distance and stop button when active */}
      {activeHint && activeHint.type === 'thermometer' && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Distance from start:</div>
            <div className="text-xl font-bold text-orange-600">
              {currentDistance !== null ? `${currentDistance}m` : '—'}
            </div>
            {(currentDistance == null || currentDistance < thermometerThresholdMeters) && (
              <div className="text-xs text-orange-500">
                Move at least {thermometerThresholdMeters}m away to stop
              </div>
            )}
            {!isCastingComplete && currentDistance != null && currentDistance >= thermometerThresholdMeters && (
              <div className="text-xs text-orange-500">
                Wait for cast time to finish, then click Stop
              </div>
            )}
          </div>

          {isCastingComplete && (
            <div className="text-center">
              <button
                onClick={handleStopThermometer}
                disabled={loading || !canStop}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
              >
                {loading
                  ? 'Getting result...'
                  : canStop
                    ? 'Stop Thermometer — Get Result'
                    : 'Stop Thermometer (move ' + thermometerThresholdMeters + 'm first)'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Takes {powerupCastingSeconds} seconds to cast
      </div>

      {/* Result at bottom — bold and prominent */}
      {thermometerResult && (
        <div className="text-center p-4 bg-orange-200/80 dark:bg-orange-900/40 border-2 border-orange-400 dark:border-orange-600 rounded-lg mt-4">
          <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {thermometerResult === 'Neutral'
              ? 'Neutral — distance hasn\'t changed much 🌡️'
              : `You're getting ${thermometerResult}! 🌡️`}
          </div>
        </div>
      )}
    </div>
  );
}