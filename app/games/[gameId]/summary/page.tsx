import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Submission } from "@/lib/types";
import { SummaryGrid } from "./SummaryGrid";

type Props = { params: Promise<{ gameId: string }> };

export default async function SummaryPage({ params }: Props) {
  const { gameId } = await params;

  // Fetch game (with fallback if winner columns don't exist yet)
  let game: Record<string, unknown> | null = null;
  {
    const { data, error } = await supabase
      .from("games")
      .select("id, name, status, winner_id, finished_at")
      .eq("id", gameId)
      .single();
    if (!error && data) {
      game = data;
    } else {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("games")
        .select("id, name, status")
        .eq("id", gameId)
        .single();
      if (fallbackErr || !fallback) notFound();
      game = { ...fallback, winner_id: null, finished_at: null };
    }
  }

  if (!game) {
    notFound();
  }

  // Fetch all players
  const { data: players } = await supabase
    .from("players")
    .select("id, name, hiding_photo")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const allPlayers = (players ?? []) as { id: number; name: string; hiding_photo: number | null }[];

  // Fetch all submissions (gracefully handles missing table)
  let allSubmissions: Submission[] = [];
  {
    const { data: submissionsData, error: subErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("game_id", gameId)
      .eq("status", "success")
      .order("created_at", { ascending: true });
    if (!subErr && submissionsData) {
      allSubmissions = submissionsData as Submission[];
    }
  }

  // Collect all photo IDs we need to resolve (hiding photos + submission photos)
  const hidingPhotoIds = allPlayers
    .map((p) => p.hiding_photo)
    .filter((id): id is number => id != null);
  const submissionPhotoIds = allSubmissions
    .map((s) => s.photo_id)
    .filter((id): id is number => id != null);
  const allPhotoIds = [...new Set([...hidingPhotoIds, ...submissionPhotoIds])];

  let photoUrlById: Record<number, string> = {};
  if (allPhotoIds.length > 0) {
    const { data: photos } = await supabase
      .from("photos")
      .select("id, url")
      .in("id", allPhotoIds);
    if (photos) {
      for (const p of photos) {
        photoUrlById[p.id as number] = (p as { url: string }).url;
      }
    }
  }

  // Resolve winner name
  let winnerName: string | null = null;
  if (game.winner_id != null) {
    const winner = allPlayers.find((p) => p.id === game.winner_id);
    winnerName = winner?.name ?? null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-emerald-50 to-green-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 pb-safe">
        <header className="mb-8">
          <Link
            href={`/games/${gameId}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/30 hover:bg-emerald-200/80 dark:hover:bg-emerald-800/40 transition-colors"
          >
            <span aria-hidden>←</span>
            Back to game
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Game Summary
          </h1>
          <p className="mt-1 text-emerald-700 dark:text-emerald-300">
            {(game as { name: string | null }).name || "Unnamed game"}
          </p>
        </header>

        {/* Winner banner */}
        {winnerName && (
          <div className="mb-8 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-300 dark:border-emerald-700 p-6 text-center">
            <div className="text-4xl mb-2" aria-hidden>🏆</div>
            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-100">
              {winnerName} wins!
            </h2>
            {game.finished_at != null && (
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                Game completed {new Date(game.finished_at as string).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Summary grid */}
        <SummaryGrid
          players={allPlayers}
          submissions={allSubmissions}
          photoUrlById={photoUrlById}
          winnerId={game.winner_id as number | null}
        />
      </main>
    </div>
  );
}
