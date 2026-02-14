"use client";

import { useState } from "react";
import Link from "next/link";

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; coords: { latitude: number; longitude: number; accuracy: number } }
  | { status: "error"; message: string };

export function LocationDisplay() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  function getLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setLocation({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          status: "success",
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? 0,
          },
        });
      },
      (err) => {
        let message = err.message;
        if (err.code === 1) message = "Permission denied. Allow location access to see your position.";
        if (err.code === 2) message = "Position unavailable. Try again.";
        if (err.code === 3) message = "Request timed out. Try again.";
        setLocation({ status: "error", message });
      },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Location test
          </h1>
          <p className="mt-3 text-lg text-amber-800/80 dark:text-amber-200/80">
            Browser GPS — get and display your current position
          </p>
        </header>

        <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={getLocation}
              disabled={location.status === "loading"}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400/70 text-white font-medium transition-colors"
            >
              {location.status === "loading" ? "Getting location…" : "Get my location"}
            </button>

            {location.status === "success" && (
              <div className="w-full space-y-4">
                <div className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 p-4 border border-amber-100 dark:border-zinc-600 font-mono text-sm text-amber-900 dark:text-amber-100 space-y-2">
                  <p>
                    <span className="text-amber-700 dark:text-amber-300">Latitude:</span>{" "}
                    {location.coords.latitude}
                  </p>
                  <p>
                    <span className="text-amber-700 dark:text-amber-300">Longitude:</span>{" "}
                    {location.coords.longitude}
                  </p>
                  <p>
                    <span className="text-amber-700 dark:text-amber-300">Accuracy:</span>{" "}
                    ±{location.coords.accuracy.toFixed(0)} m
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
                >
                  Show on Google Maps →
                </a>
              </div>
            )}

            {location.status === "error" && (
              <p className="text-red-600 dark:text-red-400 text-sm text-center">
                {location.message}
              </p>
            )}
          </div>
        </section>

        <footer className="mt-12 text-center text-sm text-amber-800/60 dark:text-amber-200/60">
          <Link href="/" className="hover:underline">
            ← Back to Snap and Seek
          </Link>
        </footer>
      </main>
    </div>
  );
}
