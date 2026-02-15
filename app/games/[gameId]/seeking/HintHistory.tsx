"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Hint, RadarHintNote, ThermometerHintNote, PhotoHintNote } from "@/lib/types";

interface Props {
  gameId: string;
  playerId: number;
}

export function HintHistory({ gameId, playerId }: Props) {
  const [hints, setHints] = useState<(Hint & { seeker: { name: string }; hider: { name: string } })[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isExpanded) return;

    const fetchHints = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/games/${gameId}/hints?seekerId=${playerId}&status=completed`
        );
        const data = await response.json();
        if (data.hints) {
          setHints(data.hints);
        }
      } catch (error) {
        console.error("Failed to fetch hint history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHints();
  }, [gameId, playerId, isExpanded]);

  // Fetch photo URLs for completed photo hints when history is expanded
  useEffect(() => {
    if (!isExpanded || hints.length === 0) return;

    const photoHints = hints.filter((h) => {
      if (h.type !== "photo" || !h.note) return false;
      try {
        const data = JSON.parse(h.note) as PhotoHintNote;
        return data.unlocked && data.photoType;
      } catch {
        return false;
      }
    });

    photoHints.forEach((hint) => {
      const noteData = JSON.parse(hint.note || "{}") as PhotoHintNote;
      const { photoType } = noteData;

      fetch(`/api/games/${gameId}/photo-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiderId: hint.hider_id, photoType }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.photoUrl) {
            setPhotoUrls((prev) => (prev[hint.id] ? prev : { ...prev, [hint.id]: data.photoUrl }));
          }
        })
        .catch(() => {});
    });
  }, [gameId, isExpanded, hints]);

  const formatHintResult = (hint: Hint): string => {
    try {
      const noteData = hint.note ? JSON.parse(hint.note) : {};

      switch (hint.type) {
        case 'radar': {
          const data = noteData as RadarHintNote;
          if (data.result) {
            return data.result.withinDistance 
              ? `✓ Within ${data.distanceMeters}m (${data.result.actualDistance}m away)`
              : `✗ Not within ${data.distanceMeters}m (${data.result.actualDistance}m away)`;
          }
          return `Radar ${data.distanceMeters}m`;
        }
        
        case 'thermometer': {
          const data = noteData as ThermometerHintNote;
          return data.result
            ? `1 → 2: ${data.result === 'same' ? 'Neutral' : data.result.charAt(0).toUpperCase() + data.result.slice(1)}`
            : `Thermometer ${data.thresholdMeters}m`;
        }
        
        case 'photo': {
          const data = noteData as PhotoHintNote;
          const photoTypeLabel = data.photoType.charAt(0).toUpperCase() + data.photoType.slice(1);
          return data.unlocked 
            ? `📸 ${photoTypeLabel} photo unlocked`
            : `📸 ${photoTypeLabel} photo`;
        }
        
        default:
          return 'Unknown hint';
      }
    } catch {
      return `${hint.type} hint`;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  const getHintIcon = (type: string): string => {
    switch (type) {
      case 'radar': return '📡';
      case 'thermometer': return '🌡️';
      case 'photo': return '📸';
      default: return '❓';
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-2 hover:bg-gray-50 rounded-lg"
      >
        <span className="font-medium text-gray-700">Hint History</span>
        <span className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="text-center text-gray-500 py-4">
              Loading hint history...
            </div>
          ) : hints.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-sm">
              No completed hints yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {hints.map((hint) => {
                const isThermometer = hint.type === "thermometer";
                let resultColor: string | undefined;
                if (isThermometer && hint.note) {
                  try {
                    const data = JSON.parse(hint.note) as ThermometerHintNote;
                    if (data.result === "hotter") resultColor = "var(--pastel-error, #b91c1c)";
                    else if (data.result === "colder") resultColor = "var(--pastel-sky, #0ea5e9)";
                  } catch { /* ignore */ }
                }
                const photoUrl = hint.type === "photo" ? photoUrls[hint.id] : undefined;
                return (
                  <div
                    key={hint.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-lg shrink-0">{getHintIcon(hint.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">vs {hint.hider.name}</span>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={resultColor ? { color: resultColor } : { color: "var(--pastel-ink)" }}
                      >
                        {formatHintResult(hint)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(hint.completed_at || hint.created_at)}
                      </div>
                      {hint.type === "photo" && photoUrl && (
                        <div className="mt-2 relative h-20 w-full max-w-[140px] rounded overflow-hidden border border-gray-200">
                          <Image
                            src={photoUrl}
                            alt="Hint photo"
                            fill
                            className="object-cover"
                            sizes="140px"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}