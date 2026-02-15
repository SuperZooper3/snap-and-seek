"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SeekingTarget {
  playerId: number;
  name: string;
  photoUrl: string | null;
}

interface AvailablePhoto {
  type: 'tree' | 'building' | 'path';
  photoId?: number;
  unavailable?: boolean;
}

interface UnlockedPhoto {
  type: 'tree' | 'building' | 'path';
  photoId?: number;
  photoUrl?: string;
  unavailable?: boolean;
}

interface Props {
  gameId: string;
  targetPlayer: SeekingTarget;
  onStartHint: (type: 'photo', initialData: Record<string, unknown>) => void;
  disabled: boolean;
  powerupCastingSeconds: number;
  completedHints: { note: string | null }[];
}

const PHOTO_TYPE_LABELS = {
  tree: '🌳 Nearest tree',
  building: '🏢 Tallest building',
  path: '🛤️ Closest path'
};

const PHOTO_TYPE_DESCRIPTIONS = {
  tree: 'The nearest tree or natural landmark to the hiding spot',
  building: 'The tallest building or structure near the hiding spot',
  path: 'The closest path, road, or walkway to the hiding spot'
};

const UNAVAILABLE_HINT_MESSAGE: Record<'tree' | 'building' | 'path', string> = {
  tree: "This player has no nearest tree or similar landmark.",
  building: "This player has no tallest building or structure.",
  path: "This player has no closest path or road."
};

export function PhotoPowerup({ 
  gameId, 
  targetPlayer, 
  onStartHint, 
  disabled,
  powerupCastingSeconds,
  completedHints
}: Props) {
  const [availablePhotos, setAvailablePhotos] = useState<AvailablePhoto[]>([]);
  const [unlockedPhotos, setUnlockedPhotos] = useState<UnlockedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhotoType, setLoadingPhotoType] = useState<string | null>(null);

  // Get completed photo unlocks from hints
  const unlockedPhotoTypes = new Set(
    completedHints.map(hint => {
      try {
        const noteData = JSON.parse(hint.note || '{}');
        return noteData.photoType;
      } catch {
        return null;
      }
    }).filter(Boolean)
  );

  // Reset state when switching to a different target so we don't show previous target's photos
  useEffect(() => {
    setUnlockedPhotos([]);
    setAvailablePhotos([]);
  }, [targetPlayer.playerId]);

  // Fetch available photos when target is set
  useEffect(() => {
    const fetchAvailablePhotos = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/photo-unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hiderId: targetPlayer.playerId,
          }),
        });

        const data = await response.json();
        if (response.ok && data.availablePhotos) {
          setAvailablePhotos(data.availablePhotos);
        }
      } catch (error) {
        console.error('Failed to fetch available photos:', error);
      }
    };

    fetchAvailablePhotos();
  }, [gameId, targetPlayer.playerId]);

  const handleUnlockPhoto = async (photoType: 'tree' | 'building' | 'path') => {
    if (disabled || loading) return;

    setLoadingPhotoType(photoType);
    setLoading(true);

    try {
      const entry = availablePhotos.find(p => p.type === photoType);
      await onStartHint('photo', {
        photoType,
        photoId: entry && 'photoId' in entry ? entry.photoId : undefined,
      });
    } catch (error) {
      console.error('Failed to start photo unlock:', error);
    } finally {
      setLoading(false);
      setLoadingPhotoType(null);
    }
  };

  const handleRevealPhoto = async (photoType: 'tree' | 'building' | 'path') => {
    if (unlockedPhotos.some(u => u.type === photoType)) return;

    try {
      const response = await fetch(`/api/games/${gameId}/photo-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiderId: targetPlayer.playerId,
          photoType,
        }),
      });

      const data = await response.json();
      if (!response.ok) return;

      if (data.unavailable) {
        setUnlockedPhotos(prev => {
          if (prev.some(u => u.type === photoType)) return prev;
          return [...prev, { type: photoType, unavailable: true }];
        });
        return;
      }
      if (data.photoUrl) {
        const newUnlockedPhoto: UnlockedPhoto = {
          type: photoType,
          photoId: data.photoId,
          photoUrl: data.photoUrl,
        };
        setUnlockedPhotos(prev => {
          if (prev.some(u => u.type === photoType)) return prev;
          return [...prev, newUnlockedPhoto];
        });
      }
    } catch (error) {
      console.error('Failed to reveal photo:', error);
    }
  };

  // Auto-reveal photos that have been unlocked through completed hints
  useEffect(() => {
    const toReveal = Array.from(unlockedPhotoTypes).filter(
      photoType => !unlockedPhotos.some(u => u.type === photoType)
    );
    
    toReveal.forEach(photoType => {
      handleRevealPhoto(photoType);
    });
  }, [completedHints.length, unlockedPhotos.length]);

  const hasAnyHint = availablePhotos.length > 0;
  if (!hasAnyHint) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg mb-2">📸</div>
        <div>No hint photos available</div>
        <div className="text-sm">{targetPlayer.name} didn&apos;t set any photo hints</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 text-center">
        Unlock hints about {targetPlayer.name}&apos;s spot in the form of nearby objects!
      </div>

      {/* Available photos to unlock, or upfront "no such object" hints */}
      <div className="space-y-3">
        {availablePhotos.map((photo) => {
          const isUnavailableUpfront = photo.unavailable === true;
          const isUnlocked = unlockedPhotos.some(u => u.type === photo.type) || unlockedPhotoTypes.has(photo.type);
          const isCurrentlyUnlocking = loadingPhotoType === photo.type;
          const alreadyCompleted = unlockedPhotoTypes.has(photo.type);
          const unlockedEntry = unlockedPhotos.find(u => u.type === photo.type);

          return (
            <div key={photo.type} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{PHOTO_TYPE_LABELS[photo.type]}</div>
                </div>

                {/* Unavailable types: no Unlock button message is shown below. */}
                {!isUnavailableUpfront && !isUnlocked && !isCurrentlyUnlocking && !alreadyCompleted && (
                  <button
                    onClick={() => handleUnlockPhoto(photo.type)}
                    disabled={disabled}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium rounded-md"
                  >
                    Unlock ({powerupCastingSeconds}s)
                  </button>
                )}

                {!isUnavailableUpfront && isCurrentlyUnlocking && (
                  <div className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-md">
                    Unlocking...
                  </div>
                )}

                {!isUnavailableUpfront && alreadyCompleted && (
                  <div className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-md font-medium">
                    ✓ Unlocked
                  </div>
                )}
              </div>

              {/* Unavailable upfront: show hint message immediately (no casting). */}
              {isUnavailableUpfront && (
                <div className="mt-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-black">
                  {UNAVAILABLE_HINT_MESSAGE[photo.type]}
                </div>
              )}

              {/* Show unlocked photo (only for types that had a photo to unlock). */}
              {!isUnavailableUpfront && isUnlocked && unlockedEntry && unlockedEntry.photoUrl && (
                <div className="mt-3">
                  <div className="relative h-48 w-full rounded-md overflow-hidden">
                    <Image
                      src={unlockedEntry.photoUrl}
                      alt={`${photo.type} hint photo`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Takes {powerupCastingSeconds} seconds to unlock each photo
      </div>
    </div>
  );
}