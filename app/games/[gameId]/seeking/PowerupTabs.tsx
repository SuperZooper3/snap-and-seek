"use client";

import { useState, useEffect } from "react";
import { CastingTimer } from "./CastingTimer";
import { RadarPowerup } from "./RadarPowerup";
import { ThermometerPowerup } from "./ThermometerPowerup";
import { PhotoPowerup } from "./PhotoPowerup";
import type { Hint } from "@/lib/types";
import type { SeekingTarget } from "./SeekingLayout";

interface Props {
  gameId: string;
  playerId: number;
  selectedTarget: SeekingTarget | null;
  powerupCastingSeconds: number;
  thermometerThresholdMeters: number;
  onHintResult: (hint: Hint) => void;
  onActiveThermometerHint?: (hint: Hint | null) => void;
}

export function PowerupTabs({
  gameId,
  playerId,
  selectedTarget,
  powerupCastingSeconds,
  thermometerThresholdMeters,
  onHintResult,
  onActiveThermometerHint,
}: Props) {
  const [selectedPowerup, setSelectedPowerup] = useState<'radar' | 'thermometer' | 'photo'>('radar');
  const [activeHints, setActiveHints] = useState<Hint[]>([]);
  const [completedHints, setCompletedHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(false);

  // Poll for hints (both active and completed)
  useEffect(() => {
    if (!selectedTarget) return;

    const fetchHints = async () => {
      try {
        // Fetch active hints
        const activeResponse = await fetch(
          `/api/games/${gameId}/hints?seekerId=${playerId}&status=casting`
        );
        const activeData = await activeResponse.json();
        if (activeData.hints) {
          setActiveHints(activeData.hints.filter((h: Hint) => h.hider_id === selectedTarget.playerId));
        }

        // Fetch completed hints for this target
        const completedResponse = await fetch(
          `/api/games/${gameId}/hints?seekerId=${playerId}&status=completed`
        );
        const completedData = await completedResponse.json();
        if (completedData.hints) {
          setCompletedHints(completedData.hints.filter((h: Hint) => h.hider_id === selectedTarget.playerId));
        }
      } catch (error) {
        console.error('Failed to fetch hints:', error);
      }
    };

    fetchHints();
    const interval = setInterval(fetchHints, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [gameId, playerId, selectedTarget]);

  const handleStartHint = async (type: 'radar' | 'thermometer' | 'photo', initialData?: Record<string, unknown>) => {
    if (!selectedTarget || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/hints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seekerId: playerId,
          hiderId: selectedTarget.playerId,
          type,
          initialData,
        }),
      });

      const data = await response.json();
      if (response.ok && data.hint) {
        setActiveHints(prev => [...prev, data.hint]);
      } else {
        console.error('Failed to start hint:', data.error);
      }
    } catch (error) {
      console.error('Failed to start hint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteHint = async (hintId: string, resultData?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/games/${gameId}/hints/${hintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          resultData,
        }),
      });

      const data = await response.json();
      if (response.ok && data.hint) {
        setActiveHints(prev => prev.filter(h => h.id !== hintId));
        setCompletedHints(prev => [...prev, data.hint]);
        onHintResult(data.hint);
      }
    } catch (error) {
      console.error('Failed to complete hint:', error);
    }
  };

  // Thermometer: don't auto-complete when timer ends; user must move and click Stop
  const handleCastingComplete = (hintId: string) => {
    const hint = activeHints.find((h) => h.id === hintId);
    if (hint?.type === "thermometer") return; // no-op: hint stays casting until user clicks Stop
    handleCompleteHint(hintId);
  };

  const handleCancelHint = async (hintId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}/hints/${hintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      if (response.ok) {
        setActiveHints(prev => prev.filter(h => h.id !== hintId));
      }
    } catch (error) {
      console.error('Failed to cancel hint:', error);
    }
  };

  if (!selectedTarget) {
    return (
      <div className="text-center text-gray-500 py-8">
        Select a target above to use power-ups
      </div>
    );
  }

  // Check if there's an active hint for this target
  const activeHint = activeHints.find(h => h.hider_id === selectedTarget.playerId);

  // Report active thermometer hint so the map can show the start pin while casting
  useEffect(() => {
    if (!onActiveThermometerHint) return;
    if (activeHint?.type === 'thermometer') {
      onActiveThermometerHint(activeHint);
    } else {
      onActiveThermometerHint(null);
    }
  }, [activeHint?.id, activeHint?.type, onActiveThermometerHint]);
  
  // Check which hints have been completed for this target
  const completedHintTypes = new Set(completedHints.map(h => h.type));

  return (
    <div className="space-y-4">
      {/* Show active casting timer if there's one */}
      {activeHint && (
        <CastingTimer
          hint={activeHint}
          onComplete={handleCastingComplete}
          onCancel={handleCancelHint}
        />
      )}

      {/* Power-up type tabs - folder style */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSelectedPowerup('radar')}
          disabled={!!activeHint && activeHint.type !== 'radar'}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            selectedPowerup === 'radar'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } ${!!activeHint && activeHint.type !== 'radar' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📡 Radar
        </button>
        <button
          onClick={() => setSelectedPowerup('thermometer')}
          disabled={!!activeHint && activeHint.type !== 'thermometer'}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            selectedPowerup === 'thermometer'
              ? 'border-orange-500 text-orange-600 bg-orange-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } ${!!activeHint && activeHint.type !== 'thermometer' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          🌡️ Thermometer
        </button>
        <button
          onClick={() => setSelectedPowerup('photo')}
          disabled={!!activeHint && activeHint.type !== 'photo'}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            selectedPowerup === 'photo'
              ? 'border-purple-500 text-purple-600 bg-purple-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } ${!!activeHint && activeHint.type !== 'photo' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📸 Photo
        </button>
      </div>

      {/* Power-up specific content */}
      <div className="min-h-[120px] bg-gray-50 rounded-lg p-4 border border-gray-200">
        {selectedPowerup === 'radar' && (
          <RadarPowerup
            gameId={gameId}
            targetPlayer={selectedTarget}
            onStartHint={handleStartHint}
            disabled={!!activeHint || loading || completedHintTypes.has('radar')}
            powerupCastingSeconds={powerupCastingSeconds}
            isCompleted={completedHintTypes.has('radar')}
            completedHint={completedHints.find(h => h.type === 'radar')}
          />
        )}
        
        {selectedPowerup === 'thermometer' && (
          <ThermometerPowerup
            gameId={gameId}
            targetPlayer={selectedTarget}
            onStartHint={handleStartHint}
            disabled={!!activeHint || loading}
            activeHint={activeHint}
            powerupCastingSeconds={powerupCastingSeconds}
            thermometerThresholdMeters={thermometerThresholdMeters}
            onHintCompleted={(hint) => {
              setActiveHints((prev) => prev.filter((h) => h.id !== hint.id));
              setCompletedHints((prev) => [...prev, hint]);
              onHintResult(hint);
              onActiveThermometerHint?.(null);
            }}
          />
        )}
        
        {selectedPowerup === 'photo' && (
          <PhotoPowerup
            gameId={gameId}
            targetPlayer={selectedTarget}
            onStartHint={handleStartHint}
            disabled={!!activeHint || loading}
            powerupCastingSeconds={powerupCastingSeconds}
            completedHints={completedHints.filter(h => h.type === 'photo')}
          />
        )}
      </div>
    </div>
  );
}