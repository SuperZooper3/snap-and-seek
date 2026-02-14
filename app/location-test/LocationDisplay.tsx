"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const MapDisplay = dynamic(
  () => import("./MapDisplay").then((mod) => ({ default: mod.MapDisplay })),
  { ssr: false }
);

export type LocationPoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; coords: { latitude: number; longitude: number; accuracy: number } }
  | { status: "error"; message: string };

const POLL_INTERVAL_MS = 10_000;

export function LocationDisplay() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [secondsUntilNextPing, setSecondsUntilNextPing] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handlePosition(position: GeolocationPosition) {
    const point: LocationPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
    };
    setLocation({
      status: "success",
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? 0,
      },
    });
    setLocationHistory((prev) => [...prev, point]);
    setSecondsUntilNextPing(10);
  }

  function pollLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (err) => {
        if (err.code === 1) setLocation({ status: "error", message: "Permission denied." });
        // Don't clear history or stop polling on temporary errors (2, 3)
      },
      { enableHighAccuracy: true }
    );
  }

  function getLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({
        status: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setLocation({ status: "loading" });
    setLocationHistory([]);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePosition(position);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(pollLocation, POLL_INTERVAL_MS);
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

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (location.status !== "success") return;
    const tick = setInterval(() => {
      setSecondsUntilNextPing((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(tick);
  }, [location.status]);

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
                <div className="w-full">
                  <MapDisplay
                    locations={locationHistory}
                    countdownSeconds={secondsUntilNextPing}
                  />
                </div>
                {locationHistory.length > 0 && (
                  <div className="rounded-lg bg-amber-50/80 dark:bg-zinc-700/80 p-4 border border-amber-100 dark:border-zinc-600">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Points
                    </h3>
                    <ul className="space-y-1.5 font-mono text-sm text-amber-800 dark:text-amber-200 max-h-40 overflow-y-auto">
                      {locationHistory.map((point, i) => (
                        <li key={`${i}-${point.timestamp}`} className="flex items-center gap-2">
                          <span className="text-amber-600 dark:text-amber-400 w-5">
                            {i + 1}.
                          </span>
                          <span>
                            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                          </span>
                          <span className="text-amber-600/80 dark:text-amber-400/80 text-xs">
                            {new Date(point.timestamp).toLocaleTimeString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
