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
  photoId: number;
}

interface UnlockedPhoto extends AvailablePhoto {
  photoUrl: string;
}

interface Props {
  gameId: string;
  targetPlayer: SeekingTarget;
  onStartHint: (type: 'photo', initialData: any) => void;
  disabled: boolean;
  powerupCastingSeconds: number;
  completedHints: any[];
}

const PHOTO_TYPE_LABELS = {
  tree: '🌳 Tree',
  building: '🏢 Building', 
  path: '🛤️ Path'
};

const PHOTO_TYPE_DESCRIPTIONS = {
  tree: 'A tree or natural landmark near the hiding spot',
  building: 'A building or structure near the hiding spot',
  path: 'A path, road, or walkway near the hiding spot'
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

  // Fetch available photos on mount
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
      // Start the hint casting
      await onStartHint('photo', {
        photoType,
        photoId: availablePhotos.find(p => p.type === photoType)?.photoId,
      });
    } catch (error) {
      console.error('Failed to start photo unlock:', error);
    } finally {
      setLoading(false);
      setLoadingPhotoType(null);
    }
  };

  const handleRevealPhoto = async (photoType: 'tree' | 'building' | 'path') => {
    // Prevent duplicate reveals
    if (unlockedPhotos.some(u => u.type === photoType)) {
      return;
    }

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
      if (response.ok && data.photoUrl) {
        const newUnlockedPhoto: UnlockedPhoto = {
          type: photoType,
          photoId: data.photoId,
          photoUrl: data.photoUrl,
        };
        setUnlockedPhotos(prev => {
          // Double-check to prevent duplicates
          if (prev.some(u => u.type === photoType)) {
            return prev;
          }
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

  if (availablePhotos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-lg mb-2">📸</div>
        <div>No hint photos available</div>
        <div className="text-sm">{targetPlayer.name} didn't take any extra photos</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 text-center">
        Unlock hint photos that {targetPlayer.name} took during hiding
      </div>

      {/* Available photos to unlock */}
      <div className="space-y-3">
        {availablePhotos.map((photo) => {
          const isUnlocked = unlockedPhotos.some(u => u.type === photo.type) || unlockedPhotoTypes.has(photo.type);
          const isCurrentlyUnlocking = loadingPhotoType === photo.type;
          const alreadyCompleted = unlockedPhotoTypes.has(photo.type);
          
          return (
            <div key={photo.type} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{PHOTO_TYPE_LABELS[photo.type]}</div>
                  <div className="text-sm text-gray-600">
                    {PHOTO_TYPE_DESCRIPTIONS[photo.type]}
                  </div>
                </div>
                
                {!isUnlocked && !isCurrentlyUnlocking && !alreadyCompleted && (
                  <button
                    onClick={() => handleUnlockPhoto(photo.type)}
                    disabled={disabled}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium rounded-md"
                  >
                    Unlock ({powerupCastingSeconds}s)
                  </button>
                )}
                
                {isCurrentlyUnlocking && (
                  <div className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-md">
                    Unlocking...
                  </div>
                )}
                
                {alreadyCompleted && (
                  <div className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-md font-medium">
                    ✓ Unlocked
                  </div>
                )}
              </div>
              
              {/* Show unlocked photo */}
              {isUnlocked && (
                <div className="mt-3">
                  {unlockedPhotos
                    .filter(u => u.type === photo.type)
                    .map(unlockedPhoto => (
                      <div key={`${photo.type}-${unlockedPhoto.photoId}`} className="relative h-48 w-full rounded-md overflow-hidden">
                        <Image
                          src={unlockedPhoto.photoUrl}
                          alt={`${photo.type} hint photo`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))
                  }
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