"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateGameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create game");
      router.push(`/games/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sketch-card p-6">
      <label className="block text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>
        Game name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Park hunt"
        className="sketch-input w-full px-4 py-3 text-base"
        style={{ color: "var(--pastel-ink)" }}
        autoFocus
      />
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--pastel-error)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full sm:w-auto">
        {loading ? "Creating…" : "Create game"}
      </button>
    </form>
  );
}
