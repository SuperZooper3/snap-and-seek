"use client";

import { useState, useEffect } from "react";
import type { Hint } from "@/lib/types";

const THERMOMETER_DISTANCES = [25, 50, 100, 150, 200];

interface SeekingTarget {
  playerId: number;
  name: string;
  photoUrl: string | null;
}

interface Props {
  gameId: string;
  targetPlayer: SeekingTarget;
  onStartHint: (type: 'thermometer', initialData: any) => void;
  disabled: boolean;
  activeHint: Hint | undefined;
  powerupCastingSeconds: number;
  isCompleted: boolean;
  completedHint?: any;
}

export function ThermometerPowerup({ 
  gameId, 
  targetPlayer, 
  onStartHint, 
  disabled,
  activeHint,
  powerupCastingSeconds,
  isCompleted,
  completedHint
}: Props) {
  const [distanceIndex, setDistanceIndex] = useState(2); // Default to 100m
  const [startPoint, setStartPoint] = useState<{lat: number, lng: number} | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [thermometerResult, setThermometerResult] = useState<string | null>(null);

  // Track current location and distance from start when thermometer is active
  useEffect(() => {
    if (!activeHint || activeHint.type !== 'thermometer' || !startPoint) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Calculate distance from start point using Haversine formula (simplified)
          const R = 6371e3; // Earth's radius in meters
          const φ1 = startPoint.lat * Math.PI/180;
          const φ2 = latitude * Math.PI/180;
          const Δφ = (latitude-startPoint.lat) * Math.PI/180;
          const Δλ = (longitude-startPoint.lng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                   Math.cos(φ1) * Math.cos(φ2) *
                   Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;

          setCurrentDistance(Math.round(distance));
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    };

    updateLocation();
    const interval = setInterval(updateLocation, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [activeHint, startPoint]);

  const handleSetStartPoint = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setStartPoint({ lat, lng });
        setLoading(false);
      },
      (error) => {
        console.error('Failed to get location:', error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStartThermometer = async () => {
    if (!startPoint || disabled || loading) return;

    const thresholdMeters = THERMOMETER_DISTANCES[distanceIndex];
    
    await onStartHint('thermometer', {
      startLat: startPoint.lat,
      startLng: startPoint.lng,
      thresholdMeters,
    });
  };

  const handleStopThermometer = async () => {
    if (!activeHint || !startPoint) return;

    setLoading(true);
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

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
        setThermometerResult(data.result);
        // Complete the hint with the result
        const hintNote = JSON.parse(activeHint.note || '{}');
        hintNote.lastLat = latitude;
        hintNote.lastLng = longitude;
        
        await fetch(`/api/games/${gameId}/hints/${activeHint.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            resultData: { result: data.result },
          }),
        });
      }
    } catch (error) {
      console.error('Failed to stop thermometer:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedThreshold = THERMOMETER_DISTANCES[distanceIndex];
  const canStart = startPoint && !activeHint && !disabled;
  const canStop = activeHint && activeHint.type === 'thermometer' && currentDistance && currentDistance >= selectedThreshold;

  // Show completed result if already used thermometer
  if (isCompleted && completedHint) {
    let resultData;
    try {
      resultData = JSON.parse(completedHint.note || '{}');
    } catch {
      resultData = {};
    }

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-orange-100 border border-orange-200 rounded-lg">
          <div className="text-lg font-bold text-orange-700 mb-2">
            Thermometer Complete ✓
          </div>
          {resultData.result && (
            <div className="text-lg font-semibold text-orange-600">
              You're getting {resultData.result}! 🌡️
            </div>
          )}
          {resultData.thresholdMeters && (
            <div className="text-sm text-orange-600 mt-1">
              Moved {resultData.thresholdMeters}m from starting point
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 text-center">
          Thermometer power-up already used for {targetPlayer.name}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 text-center">
        Set a starting point, move away, then get "hotter/colder" feedback
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

      {/* Step 2: Distance threshold */}
      {startPoint && (
        <div>
          <div className="text-sm text-gray-600 text-center mb-2">
            Minimum distance to move:
          </div>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setDistanceIndex(Math.max(0, distanceIndex - 1))}
              disabled={distanceIndex === 0 || disabled}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              −
            </button>
            
            <div className="text-center min-w-[80px]">
              <div className="text-lg font-semibold">{selectedThreshold}m</div>
            </div>
            
            <button
              onClick={() => setDistanceIndex(Math.min(THERMOMETER_DISTANCES.length - 1, distanceIndex + 1))}
              disabled={distanceIndex === THERMOMETER_DISTANCES.length - 1 || disabled}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Start thermometer or show status */}
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
      {activeHint && activeHint.type === 'thermometer' && currentDistance !== null && (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Distance from start:</div>
            <div className="text-xl font-bold text-orange-600">{currentDistance}m</div>
            {currentDistance < selectedThreshold && (
              <div className="text-xs text-orange-500">
                Move at least {selectedThreshold}m away to stop
              </div>
            )}
          </div>

          {canStop && (
            <div className="text-center">
              <button
                onClick={handleStopThermometer}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg"
              >
                {loading ? 'Getting result...' : 'Stop Thermometer'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show result */}
      {thermometerResult && (
        <div className="text-center p-3 bg-orange-100 border border-orange-200 rounded-lg">
          <div className="text-lg font-bold text-orange-700">
            You're getting {thermometerResult}! 🌡️
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Takes {powerupCastingSeconds} seconds to cast
      </div>
    </div>
  );
}