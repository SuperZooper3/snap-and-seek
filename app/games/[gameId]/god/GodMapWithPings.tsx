"use client";

import { useCallback, useEffect, useState } from "react";
import { GodMapView, type PlayerMarker } from "./GodMapView";

const REFRESH_MS = 5000;
const PLAYER_COLORS = [
  "#7c3aed", // purple
  "#ea580c", // orange
  "#16a34a", // green
  "#dc2626", // red
  "#1e3a8a", // dark blue
  "#0d9488", // teal
  "#c026d3", // fuchsia
  "#ca8a04", // yellow
  "#be123c", // rose
  "#0369a1", // sky
];

type Zone = {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
};

type Props = {
  gameId: string;
  zone: Zone;
};

type PingRow = {
  player_id: number;
  name: string;
  lat: number;
  lng: number;
  created_at: string;
};

function getColorForPlayerIndex(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function GodMapWithPings({ gameId, zone }: Props) {
  const [pings, setPings] = useState<PingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}/pings/latest`);
      if (!res.ok) {
        setError("Failed to load positions");
        return;
      }
      const data = (await res.json()) as PingRow[];
      setPings(data);
      setError(null);
    } catch {
      setError("Failed to load positions");
    }
  }, [gameId]);

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchLatest]);

  const playerMarkers: PlayerMarker[] = pings.map((p, i) => ({
    player_id: p.player_id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    color: getColorForPlayerIndex(i),
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-zinc-800/80 border-b border-white/10 text-sm">
        <span className="text-white/90">Refreshes every 5s</span>
        <span className="text-xs text-white/70">
          {playerMarkers.length} player{playerMarkers.length !== 1 ? "s" : ""} on map
        </span>
      </div>
      {error && (
        <div className="shrink-0 bg-red-600 text-white px-3 py-2 text-center text-sm">
          {error}
        </div>
      )}
      <div className="relative min-h-0 flex-1 w-full">
        <GodMapView zone={zone} playerMarkers={playerMarkers} />
      </div>
      {playerMarkers.length > 0 && (
        <div className="shrink-0 border-t border-white/10 bg-zinc-800/80 px-3 py-2 safe-area-inset-bottom">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {playerMarkers.map((p, i) => (
              <span
                key={p.player_id}
                className="inline-flex items-center gap-1.5 text-xs text-white"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                  style={{ backgroundColor: getColorForPlayerIndex(i) }}
                />
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
