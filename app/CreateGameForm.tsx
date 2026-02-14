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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6"
    >
      <label className="block text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
        Game name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Park hunt"
        className="w-full rounded-lg border border-amber-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-4 py-3 text-amber-900 dark:text-amber-100 placeholder:text-amber-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        autoFocus
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-amber-950 font-semibold px-6 py-3 transition-colors"
      >
        {loading ? "Creating…" : "Create game"}
      </button>
    </form>
  );
}
