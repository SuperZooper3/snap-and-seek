"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { CameraModal } from "@/components/CameraModal";
import { ItemBar } from "@/components/ItemBar";
import { getLocation } from "@/lib/get-location";

/** The three optional "visible from" items. IDs match the player column names. */
const VISIBLE_FROM_ITEMS: { id: string; label: string }[] = [
  { id: "tree", label: "Nearest tree" },
  { id: "building", label: "Tallest building" },
  { id: "path", label: "Closest path" },
];

/** Accuracy thresholds (meters) for main photo warnings. */
const ACCURACY_POOR_M = 30;

type PhotoSlot = {
  previewUrl?: string;
  uploadedUrl?: string;
  /** ID of the photo record in the database (bigint) */
  photoId?: number;
  uploading: boolean;
  /** GPS accuracy in meters (for main photo). */
  accuracyM?: number;
  /** True when main photo was taken with poor accuracy (>30m). */
  badAccuracy?: boolean;
  /** Error message when location was required but failed (main photo). */
  locationError?: string;
};

type Props = {
  gameId: string;
  gameName: string;
  playerId: number;
  playerName: string;
};

export function SetupClient({ gameId, gameName, playerId, playerName }: Props) {
  const [mainPhoto, setMainPhoto] = useState<PhotoSlot>({ uploading: false });

  const [itemPhotos, setItemPhotos] = useState<Record<string, PhotoSlot>>(() =>
    Object.fromEntries(VISIBLE_FROM_ITEMS.map((item) => [item.id, { uploading: false }]))
  );

  const [cameraTarget, setCameraTarget] = useState<string | null>(null);

  // "I don't have this option" per visible-from item allows progressing without a photo
  const [unavailableItems, setUnavailableItems] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(VISIBLE_FROM_ITEMS.map((item) => [item.id, false]))
  );

  const [lockingIn, setLockingIn] = useState(false);

  const isItemSatisfied = useCallback(
    (itemId: string) => {
      const slot = itemPhotos[itemId];
      return (slot?.photoId != null) || unavailableItems[itemId] === true;
    },
    [itemPhotos, unavailableItems]
  );

  const allItemsSatisfied = VISIBLE_FROM_ITEMS.every((item) => isItemSatisfied(item.id));

  const uploadPhoto = useCallback(
    async (
      blob: Blob,
      coords?: { latitude: number; longitude: number; accuracy: number }
    ): Promise<{ url: string; id: number; accuracy?: number } | null> => {
      const formData = new FormData();
      formData.append("file", blob, `capture-${Date.now()}.jpg`);
      formData.append("game_id", gameId);
      formData.append("player_id", String(playerId));

      let accuracy: number | undefined;
      if (coords) {
        formData.append("latitude", String(coords.latitude));
        formData.append("longitude", String(coords.longitude));
        formData.append("accuracy", String(coords.accuracy));
        accuracy = coords.accuracy;
      } else {
        try {
          const loc = await getLocation();
          formData.append("latitude", String(loc.latitude));
          formData.append("longitude", String(loc.longitude));
          formData.append("accuracy", String(loc.accuracy));
          accuracy = loc.accuracy;
        } catch {
          // Proceed without location for extra photos
        }
      }

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.photo?.url && data.photo?.id != null) {
          return {
            url: data.photo.url as string,
            id: data.photo.id as number,
            ...(accuracy != null && { accuracy }),
          };
        }
        console.error("Upload failed:", data.error);
        return null;
      } catch (err) {
        console.error("Upload error:", err);
        return null;
      }
    },
    [gameId, playerId]
  );

  const handleMainCapture = useCallback(
    async (blob: Blob) => {
      const previewUrl = URL.createObjectURL(blob);
      setMainPhoto({ previewUrl, uploading: true });
      setCameraTarget(null);

      // Main photo requires a GPS fix with good accuracy; get it before upload
      let coords: { latitude: number; longitude: number; accuracy: number } | undefined;
      try {
        coords = await getLocation();
      } catch (err) {
        setMainPhoto((prev) => ({
          ...prev,
          uploading: false,
          locationError: err instanceof Error ? err.message : "Could not get location.",
        }));
        return;
      }

      const result = await uploadPhoto(blob, coords);
      const accuracyM = result?.accuracy ?? coords.accuracy;
      const badAccuracy = accuracyM > ACCURACY_POOR_M;

      setMainPhoto((prev) => ({
        ...prev,
        uploading: false,
        uploadedUrl: result?.url ?? undefined,
        photoId: result?.id ?? undefined,
        accuracyM,
        badAccuracy,
        locationError: undefined,
      }));
    },
    [uploadPhoto]
  );

  const makeItemCapture = useCallback(
    (itemId: string) => {
      return async (blob: Blob) => {
        const previewUrl = URL.createObjectURL(blob);
        setItemPhotos((prev) => ({
          ...prev,
          [itemId]: { previewUrl, uploading: true },
        }));
        setCameraTarget(null);

        const result = await uploadPhoto(blob);

        setItemPhotos((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            uploading: false,
            uploadedUrl: result?.url ?? undefined,
            photoId: result?.id ?? undefined,
          },
        }));
      };
    },
    [uploadPhoto]
  );

  const getActiveCaptureCallback = useCallback(() => {
    if (cameraTarget === "main") return handleMainCapture;
    if (cameraTarget) {
      const item = VISIBLE_FROM_ITEMS.find((i) => i.id === cameraTarget);
      if (item) return makeItemCapture(item.id);
    }
    return () => {};
  }, [cameraTarget, handleMainCapture, makeItemCapture]);

  async function handleLockIn() {
    if (!mainPhoto.photoId) return;

    setLockingIn(true);
    try {
      const res = await fetch(`/api/games/${gameId}/lock-in`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          hiding_photo: mainPhoto.photoId,
          tree_photo: itemPhotos["tree"]?.photoId ?? null,
          building_photo: itemPhotos["building"]?.photoId ?? null,
          path_photo: itemPhotos["path"]?.photoId ?? null,
          unavailable_photo_types: VISIBLE_FROM_ITEMS.filter((item) => unavailableItems[item.id]).map((item) => item.id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to lock in photos");
      }

      window.location.href = `/games/${gameId}/waiting`;
    } catch (err) {
      setLockingIn(false);
      alert(err instanceof Error ? err.message : "Failed to lock in photos");
    }
  }

  const anyUploading =
    mainPhoto.uploading ||
    Object.values(itemPhotos).some((s) => s.uploading);

  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-lg px-4 py-8 pb-24">
        <header className="mb-8">
          <Link
            href={`/games/${gameId}`}
            className="btn-ghost inline-flex items-center gap-1.5"
          >
            <BackArrowIcon /> Back to game
          </Link>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {gameName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            Setting up as <strong style={{ color: "var(--foreground)" }}>{playerName}</strong>
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--foreground)" }}>
            Hiding Spot Photo
          </h2>

          <button
            type="button"
            onClick={() => setCameraTarget("main")}
            className={`w-full rounded-2xl border-[3px] transition-all overflow-hidden touch-manipulation ${
              mainPhoto.uploadedUrl ? "" : "border-dashed"
            }`}
            style={{
              borderColor: "var(--pastel-border)",
              background: mainPhoto.uploadedUrl ? "var(--pastel-mint)" : "var(--pastel-paper)",
              boxShadow: "4px 4px 0 var(--pastel-border-subtle)",
            }}
          >
            {mainPhoto.previewUrl || mainPhoto.uploadedUrl ? (
              <div className="relative">
                <img
                  src={mainPhoto.uploadedUrl ?? mainPhoto.previewUrl}
                  alt="Main hiding spot"
                  className="w-full aspect-[4/3] object-cover"
                />
                {mainPhoto.uploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center font-bold"
                    style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading...
                    </span>
                  </div>
                )}
                {mainPhoto.uploadedUrl && !mainPhoto.uploading && (
                  <div className="absolute top-3 right-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border-2"
                      style={{
                        background: "var(--pastel-mint)",
                        borderColor: "var(--pastel-border)",
                        color: "var(--pastel-ink)",
                      }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Uploaded
                    </span>
                  </div>
                )}
                {/* Accuracy readout and warnings for main photo */}
                {mainPhoto.uploadedUrl && !mainPhoto.uploading && mainPhoto.accuracyM != null && (
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border-2"
                      style={{
                        background: "var(--pastel-paper)",
                        borderColor: "var(--pastel-border)",
                        color: "var(--pastel-ink)",
                      }}
                    >
                      ±{Math.round(mainPhoto.accuracyM)} m
                    </span>
                  </div>
                )}
                {mainPhoto.badAccuracy && (
                  <div
                    className="absolute inset-x-0 bottom-12 px-4 py-2 text-xs font-bold border-t-2"
                    style={{
                      background: "rgba(220,80,60,0.9)",
                      color: "white",
                      borderColor: "var(--pastel-error)",
                    }}
                  >
                    Location accuracy is poor (&gt;30 m). Consider retaking for better gameplay.
                  </div>
                )}
                {mainPhoto.locationError && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 py-3 font-bold text-sm text-center"
                    style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
                  >
                    <span>Location required for main photo.</span>
                    <span className="text-xs font-normal">{mainPhoto.locationError}</span>
                    <span className="text-xs opacity-90">Tap to retake with location on.</span>
                  </div>
                )}
                <div
                  className="absolute bottom-0 inset-x-0 px-4 py-3 font-bold text-xs"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))", color: "white" }}
                >
                  Tap to retake
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12" style={{ color: "var(--pastel-ink-muted)" }}>
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <p className="text-sm font-bold" style={{ color: "var(--pastel-ink)" }}>
                  Tap to take your hiding spot photo
                </p>
                <p className="text-xs mt-1">
                  This is the main photo other teams will see
                </p>
              </div>
            )}
          </button>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--foreground)" }}>
            Nearby Landmarks
          </h2>
          <p className="text-sm mb-3" style={{ color: "var(--pastel-ink-muted)" }}>
            These photos will be used as hints that seekers can unlock during the game.
          </p>
          <div className="space-y-3">
            {VISIBLE_FROM_ITEMS.map((item) => {
              const slot = itemPhotos[item.id] ?? { uploading: false };
              const hasPhoto = slot.photoId != null;
              return (
                <div key={item.id} className="space-y-1.5">
                  <ItemBar
                    label={item.label}
                    photoUrl={slot.uploadedUrl ?? slot.previewUrl}
                    uploading={slot.uploading}
                    uploaded={!!slot.uploadedUrl}
                    onClick={() => setCameraTarget(item.id)}
                  />
                  <label className="flex items-center gap-2 text-base font-bold text-[var(--foreground)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={unavailableItems[item.id] ?? false}
                      disabled={hasPhoto}
                      onChange={(e) =>
                        setUnavailableItems((prev) => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))
                      }
                      className="rounded border-2 border-[var(--pastel-border)] text-[var(--pastel-ink)] focus:ring-2 focus:ring-[var(--pastel-sky)] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={hasPhoto ? "opacity-70" : undefined}>
                      I don&apos;t have this option
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <div
          className="fixed bottom-0 inset-x-0 px-4 py-4 font-sans"
          style={{ background: "var(--background)" }}
        >
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={!mainPhoto.photoId || !allItemsSatisfied || anyUploading || lockingIn}
              onClick={handleLockIn}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {lockingIn ? "Saving…" : "Next"}
            </button>
          </div>
        </div>
      </main>

      <CameraModal
        isOpen={cameraTarget !== null}
        onClose={() => setCameraTarget(null)}
        onCapture={getActiveCaptureCallback()}
      />
    </div>
  );
}
