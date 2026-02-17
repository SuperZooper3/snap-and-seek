import Link from "next/link";
import { notFound } from "next/navigation";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { supabase } from "@/lib/supabase";
import type { Submission } from "@/lib/types";
import { SummaryGrid } from "./SummaryGrid";

type Props = { params: Promise<{ gameId: string }> };

export default async function SummaryPage({ params }: Props) {
  const { gameId } = await params;

  let game: Record<string, unknown> | null = null;
  {
    const { data, error } = await supabase
      .from("games")
      .select("id, name, status, winner_id, winner_ids, finished_at")
      .eq("id", gameId)
      .single();
    if (!error && data) {
      game = data;
    } else {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("games")
        .select("id, name, status, winner_id, finished_at")
        .eq("id", gameId)
        .single();
      if (fallbackErr || !fallback) notFound();
      game = { ...fallback, winner_ids: null };
    }
  }

  if (!game) {
    notFound();
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, name, hiding_photo")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const allPlayers = (players ?? []) as { id: number; name: string; hiding_photo: number | null }[];

  let allSubmissions: Submission[] = [];
  {
    const { data: submissionsData, error: subErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });
    if (!subErr && submissionsData) {
      allSubmissions = submissionsData as Submission[];
    }
  }

  const hidingPhotoIds = allPlayers
    .map((p) => p.hiding_photo)
    .filter((id): id is number => id != null);
  const submissionPhotoIds = allSubmissions
    .map((s) => s.photo_id)
    .filter((id): id is number => id != null);
  const allPhotoIds = [...new Set([...hidingPhotoIds, ...submissionPhotoIds])];

  const photoUrlById: Record<number, string> = {};
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

  const winnerIds: number[] =
    Array.isArray(game.winner_ids) && game.winner_ids.length > 0
      ? game.winner_ids
      : game.winner_id != null
        ? [game.winner_id as number]
        : [];
  const winnerNames = winnerIds
    .map((id) => allPlayers.find((p) => p.id === id)?.name)
    .filter((n): n is string => n != null);
  const winnerDisplay =
    winnerNames.length === 0
      ? null
      : winnerNames.length === 1
        ? `${winnerNames[0]} wins!`
        : winnerNames.length === 2
          ? `${winnerNames[0]} and ${winnerNames[1]} win!`
          : `${winnerNames.slice(0, -1).join(", ")}, and ${winnerNames[winnerNames.length - 1]} win!`;

  return (
    <div className="min-h-screen min-h-[100dvh] font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 pb-safe">
        <header className="mb-8">
          <Link href={`/games/${gameId}`} className="btn-ghost inline-flex items-center gap-1.5">
            <BackArrowIcon />
            Back to game
          </Link>
          <h1 className="mt-4 text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Game Summary
          </h1>
          <p className="mt-1" style={{ color: "var(--pastel-ink-muted)" }}>
            {(game as { name: string | null }).name || "Unnamed game"}
          </p>
        </header>

        {winnerDisplay && (
          <div
            className="mb-8 sketch-card p-6 text-center"
            style={{
              background: "var(--pastel-mint)",
            }}
          >
            <div className="text-4xl mb-2" aria-hidden>🏆</div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--pastel-ink)" }}>
              {winnerDisplay}
            </h2>
            {game.finished_at ? (
              <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
                Game completed {new Date(game.finished_at as string).toLocaleString()}
              </p>
            ) : null}
          </div>
        )}

        <SummaryGrid
          players={allPlayers}
          submissions={allSubmissions}
          photoUrlById={photoUrlById}
          winnerIds={winnerIds}
        />
      </main>
    </div>
  );
}
