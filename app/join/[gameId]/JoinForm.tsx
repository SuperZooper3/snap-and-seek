"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPlayerInCookie } from "@/lib/player-cookie";
import { addGameToYourGames } from "@/lib/your-games-cookie";

type Props = { gameId: string; isRejoin?: boolean };

export function JoinForm({ gameId, isRejoin = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      addGameToYourGames(gameId);
      setPlayerInCookie(gameId, { id: data.id, name: data.name });
      router.push(`/games/${gameId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>
        {isRejoin
          ? "Enter the name you used when you joined"
          : "Your name"}
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Alex"
        required
        className="sketch-input w-full px-4 py-3 text-base"
        style={{ color: "var(--pastel-ink)" }}
        autoFocus
      />
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--pastel-error)" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-50"
      >
        {loading ? (isRejoin ? "Rejoining…" : "Adding…") : (isRejoin ? "Rejoin" : "Add me")}
      </button>
    </form>
  );
}
