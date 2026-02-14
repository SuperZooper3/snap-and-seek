"use client";

import { Photo } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { CameraCapture } from "./CameraCapture";
import { getLocation } from "@/lib/get-location";

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; coords: { latitude: number; longitude: number; accuracy: number } }
  | { status: "error"; message: string };

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Geolocation state — mirrors patterns from LocationDisplay.tsx
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const locationRef = useRef<LocationState>({ status: "idle" });

  // Keep ref in sync so the capture callback always has the latest value
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Fetch photos on mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Request geolocation on mount (same pattern as LocationDisplay)
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/photos");
      const data = await response.json();

      if (data.success) {
        setPhotos(data.photos);
      } else {
        console.error("Failed to fetch photos:", data.error);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  function requestLocation() {
    setLocation({ status: "loading" });
    getLocation()
      .then((pos) => {
        setLocation({
          status: "success",
          coords: {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
          },
        });
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Could not get location.";
        setLocation({ status: "error", message });
      });
  }

  const handleCapture = async (blob: Blob) => {
    setUploading(true);
    setMessage(null);

    // Refresh geolocation right before upload for maximum freshness
    let freshCoords: { latitude: number; longitude: number } | null = null;
    try {
      const pos = await getLocation();
      freshCoords = { latitude: pos.latitude, longitude: pos.longitude };
      setLocation({
        status: "success",
        coords: {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
        },
      });
    } catch {
      // Fall back to previously captured location
      if (locationRef.current.status === "success") {
        freshCoords = {
          latitude: locationRef.current.coords.latitude,
          longitude: locationRef.current.coords.longitude,
        };
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", blob, `capture-${Date.now()}.jpg`);

      if (freshCoords) {
        formData.append("latitude", String(freshCoords.latitude));
        formData.append("longitude", String(freshCoords.longitude));
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Photo uploaded successfully!",
        });
        // Refresh photos list
        await fetchPhotos();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload photo",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Photo Upload Test
          </h1>
          <p className="mt-2 text-amber-800/80 dark:text-amber-200/80">
            Take a photo and upload it with your location
          </p>
        </header>

        {/* Camera + Upload Section */}
        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Take Photo
          </h2>

          <CameraCapture onCapture={handleCapture} disabled={uploading} />

          {/* Location status */}
          <div className="mt-4">
            {location.status === "loading" && (
              <p className="text-sm text-amber-800/70 dark:text-amber-200/70">
                Getting your location…
              </p>
            )}
            {location.status === "success" && (
              <div className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 p-3 border border-amber-100 dark:border-zinc-600 font-mono text-xs text-amber-900 dark:text-amber-100 space-y-1">
                <p>
                  <span className="text-amber-700 dark:text-amber-300">
                    Location:
                  </span>{" "}
                  {location.coords.latitude.toFixed(5)},{" "}
                  {location.coords.longitude.toFixed(5)}
                </p>
                <p>
                  <span className="text-amber-700 dark:text-amber-300">
                    Accuracy:
                  </span>{" "}
                  ±{location.coords.accuracy.toFixed(0)} m
                </p>
              </div>
            )}
            {location.status === "error" && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {location.message}
                </p>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Upload status message */}
          {uploading && (
            <p className="mt-4 text-sm text-amber-800/70 dark:text-amber-200/70">
              Uploading…
            </p>
          )}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </section>

        {/* Photos Display Section */}
        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4">
            Uploaded Photos ({photos.length})
          </h2>

          {loading && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              Loading photos...
            </p>
          )}

          {!loading && photos.length === 0 && (
            <p className="text-amber-800/70 dark:text-amber-200/70">
              No photos yet. Take your first photo above!
            </p>
          )}

          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 border border-amber-100 dark:border-zinc-600 overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-amber-100 dark:bg-zinc-600">
                    <img
                      src={photo.url}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="p-3 space-y-1">
                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-xs text-amber-900/70 dark:text-amber-100/70">
                      <svg
                        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        {photo.location_name
                          ? photo.location_name
                          : photo.latitude != null && photo.longitude != null
                            ? `${photo.latitude.toFixed(5)}, ${photo.longitude.toFixed(5)}`
                            : "Location unavailable"}
                      </span>
                    </div>

                    <p className="text-xs text-amber-900/70 dark:text-amber-100/70">
                      <span className="font-semibold">Uploaded:</span>{" "}
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-amber-600 dark:text-amber-400 hover:underline text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}
