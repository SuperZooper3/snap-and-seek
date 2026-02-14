"use client";

import { useState } from "react";

const RADAR_DISTANCES = [10, 25, 50, 100, 200, 500];

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
  isCompleted: boolean;
  completedHint?: { note: string | null };
}

export function RadarPowerup({ 
  gameId, 
  targetPlayer, 
  onStartHint, 
  disabled,
  powerupCastingSeconds,
  isCompleted,
  completedHint
}: Props) {
  const [distanceIndex, setDistanceIndex] = useState(2); // Default to 50m
  const [loading, setLoading] = useState(false);

  const handleCastRadar = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
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

  // Show completed result if already used radar
  if (isCompleted && completedHint) {
    let resultData;
    try {
      resultData = JSON.parse(completedHint.note || '{}');
    } catch {
      resultData = {};
    }

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-blue-100 border border-blue-200 rounded-lg">
          <div className="text-lg font-bold text-blue-700 mb-2">
            Radar Complete ✓
          </div>
          {resultData.result && (
            <div>
              <div className="text-sm text-blue-600">
                Searched within {resultData.distanceMeters}m
              </div>
              <div className={`text-lg font-semibold ${
                resultData.result.withinDistance ? 'text-green-600' : 'text-red-600'
              }`}>
                {resultData.result.withinDistance ? 'Yes' : 'No'} 
                ({resultData.result.actualDistance}m away)
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 text-center">
          Radar power-up already used for {targetPlayer.name}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 text-center">
        Check if you&apos;re within a certain distance of {targetPlayer.name}&apos;s hiding spot
      </div>

      {/* Distance stepper */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={() => setDistanceIndex(Math.max(0, distanceIndex - 1))}
          disabled={distanceIndex === 0 || disabled}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
        >
          −
        </button>
        
        <div className="text-center min-w-[80px]">
          <div className="text-lg font-semibold">{selectedDistance}m</div>
        </div>
        
        <button
          onClick={() => setDistanceIndex(Math.min(RADAR_DISTANCES.length - 1, distanceIndex + 1))}
          disabled={distanceIndex === RADAR_DISTANCES.length - 1 || disabled}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
        >
          +
        </button>
      </div>

      {/* Cast button */}
      <div className="text-center">
        <button
          onClick={handleCastRadar}
          disabled={disabled || loading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
        >
          {loading ? 'Getting location...' : `Cast Radar (${powerupCastingSeconds}s)`}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Takes {powerupCastingSeconds} seconds to cast
      </div>
    </div>
  );
}