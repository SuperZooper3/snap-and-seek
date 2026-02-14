"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CameraModal } from "@/components/CameraModal";
import { ItemBar } from "@/components/ItemBar";

/** The two hardcoded optional items for now. Will be dynamic later. */
const DEFAULT_ITEMS: { id: string; label: string }[] = [
  { id: "item-1", label: "Tree" },
  { id: "item-2", label: "Rock" },
];

type PhotoSlot = {
  previewUrl?: string;
  uploadedUrl?: string;
  uploading: boolean;
};

type Props = {
  gameId: string;
  gameName: string;
  playerId: number;
  playerName: string;
};

export function SetupClient({ gameId, gameName, playerId, playerName }: Props) {
  // Main hiding-spot photo state
  const [mainPhoto, setMainPhoto] = useState<PhotoSlot>({ uploading: false });

  // Optional "visible from" items — each keyed by its id
  const [itemPhotos, setItemPhotos] = useState<Record<string, PhotoSlot>>(() =>
    Object.fromEntries(DEFAULT_ITEMS.map((item) => [item.id, { uploading: false }]))
  );

  // Which slot the camera modal is open for: "main", an item id, or null (closed)
  const [cameraTarget, setCameraTarget] = useState<string | null>(null);

  // ------- Upload helper -------
  const uploadPhoto = useCallback(
    async (
      blob: Blob,
      opts: { label: string | null; isMain: boolean }
    ): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", blob, `capture-${Date.now()}.jpg`);
      formData.append("game_id", gameId);
      formData.append("player_id", String(playerId));
      if (opts.label) formData.append("label", opts.label);
      formData.append("is_main", String(opts.isMain));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.photo?.url) {
          return data.photo.url as string;
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

  // ------- Per-slot capture callbacks -------

  /** Callback for the main hiding-spot photo. */
  const handleMainCapture = useCallback(
    async (blob: Blob) => {
      const previewUrl = URL.createObjectURL(blob);
      setMainPhoto({ previewUrl, uploading: true });
      setCameraTarget(null);

      const uploadedUrl = await uploadPhoto(blob, {
        label: null,
        isMain: true,
      });

      setMainPhoto((prev) => ({
        ...prev,
        uploading: false,
        uploadedUrl: uploadedUrl ?? undefined,
      }));
    },
    [uploadPhoto]
  );

  /** Factory that returns a capture callback for a specific item. */
  const makeItemCapture = useCallback(
    (itemId: string, label: string) => {
      return async (blob: Blob) => {
        const previewUrl = URL.createObjectURL(blob);
        setItemPhotos((prev) => ({
          ...prev,
          [itemId]: { previewUrl, uploading: true },
        }));
        setCameraTarget(null);

        const uploadedUrl = await uploadPhoto(blob, {
          label,
          isMain: false,
        });

        setItemPhotos((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            uploading: false,
            uploadedUrl: uploadedUrl ?? undefined,
          },
        }));
      };
    },
    [uploadPhoto]
  );

  // ------- Determine the active capture callback -------
  const getActiveCaptureCallback = useCallback(() => {
    if (cameraTarget === "main") return handleMainCapture;
    if (cameraTarget) {
      const item = DEFAULT_ITEMS.find((i) => i.id === cameraTarget);
      if (item) return makeItemCapture(item.id, item.label);
    }
    // Fallback (shouldn't happen)
    return () => {};
  }, [cameraTarget, handleMainCapture, makeItemCapture]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-lg px-4 py-8 pb-24">
        {/* Header */}
        <header className="mb-8">
          <Link
            href={`/games/${gameId}`}
            className="text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
          >
            &larr; Back to game
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-amber-900 dark:text-amber-100">
            {gameName}
          </h1>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Setting up as <strong>{playerName}</strong>
          </p>
        </header>

        {/* Main hiding-spot photo */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-amber-900/80 dark:text-amber-100/80 uppercase tracking-wide mb-3">
            Hiding Spot Photo
          </h2>

          <button
            type="button"
            onClick={() => setCameraTarget("main")}
            className={`w-full rounded-2xl border-2 transition-colors overflow-hidden
              ${
                mainPhoto.uploadedUrl
                  ? "border-amber-300 dark:border-amber-600"
                  : "border-dashed border-amber-300/60 dark:border-zinc-600 hover:border-amber-400 dark:hover:border-zinc-500"
              }`}
          >
            {mainPhoto.previewUrl || mainPhoto.uploadedUrl ? (
              <div className="relative">
                <img
                  src={mainPhoto.uploadedUrl ?? mainPhoto.previewUrl}
                  alt="Main hiding spot"
                  className="w-full aspect-[4/3] object-cover"
                />
                {mainPhoto.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-sm font-medium flex items-center gap-2">
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Uploading...
                    </div>
                  </div>
                )}
                {mainPhoto.uploadedUrl && !mainPhoto.uploading && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/60 px-2.5 py-1 rounded-full shadow">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Uploaded
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3">
                  <p className="text-white text-xs font-medium">
                    Tap to retake
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-amber-700 dark:text-amber-300">
                <svg
                  className="w-12 h-12 mb-3 text-amber-400 dark:text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
                <p className="text-sm font-medium">
                  Tap to take your hiding spot photo
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  This is the main photo other teams will see
                </p>
              </div>
            )}
          </button>
        </section>

        {/* Visible-from items */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-amber-900/80 dark:text-amber-100/80 uppercase tracking-wide mb-3">
            Visible from
          </h2>
          <div className="space-y-3">
            {DEFAULT_ITEMS.map((item) => {
              const slot = itemPhotos[item.id] ?? { uploading: false };
              return (
                <ItemBar
                  key={item.id}
                  label={item.label}
                  photoUrl={slot.uploadedUrl ?? slot.previewUrl}
                  uploading={slot.uploading}
                  uploaded={!!slot.uploadedUrl}
                  onClick={() => setCameraTarget(item.id)}
                />
              );
            })}
          </div>
        </section>

        {/* Next button */}
        <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-amber-50 via-amber-50 to-transparent dark:from-zinc-950 dark:via-zinc-950 px-4 py-4">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => {
                // Placeholder — will navigate to waiting/lobby later
                window.location.href = `/games/${gameId}`;
              }}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-6 py-3.5 transition-colors shadow-lg text-base"
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraTarget !== null}
        onClose={() => setCameraTarget(null)}
        onCapture={getActiveCaptureCallback()}
      />
    </div>
  );
}
