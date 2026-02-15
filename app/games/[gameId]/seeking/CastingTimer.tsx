"use client";

import { useState, useEffect } from "react";
import type { Hint } from "@/lib/types";

interface Props {
  hint: Hint;
  onComplete: (hintId: string) => void;
  onCancel: (hintId: string) => void;
  className?: string;
}

export function CastingTimer({ hint, onComplete, onCancel, className = "" }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (hint.status !== "casting") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync completed state from hint prop
      setIsCompleted(true);
      return;
    }

    const startTime = new Date(hint.created_at).getTime();
    const endTime = startTime + hint.casting_duration_seconds * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      if (remaining === 0 && !isCompleted) {
        setIsCompleted(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(1500);
        }
        onComplete(hint.id);
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [hint.id, hint.status, hint.created_at, hint.casting_duration_seconds, onComplete, isCompleted]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const progress = hint.casting_duration_seconds > 0
    ? Math.max(0, 1 - timeRemaining / (hint.casting_duration_seconds * 1000))
    : 0;

  if (isCompleted || hint.status === "completed") {
    return (
      <div className={`bg-green-100 border border-green-300 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-center">
          <span className="text-green-700 font-medium">✓ Casting Complete</span>
        </div>
      </div>
    );
  }

  if (hint.status === "cancelled") {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-center">
          <span className="text-gray-700 font-medium">✗ Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-blue-700 font-medium">
          Casting {hint.type} power-up...
        </span>
        <button
          onClick={() => onCancel(hint.id)}
          className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded"
        >
          Cancel
        </button>
      </div>
      
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        {/* Time remaining */}
        <div className="text-center text-blue-600 font-mono text-sm">
          {formatTime(timeRemaining)} remaining
        </div>
      </div>
    </div>
  );
}