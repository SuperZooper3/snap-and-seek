import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";

type Props = { params: Promise<{ gameId: string }> };

export default async function CapturePage({ params }: Props) {
  const { gameId } = await params;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  if (!getPlayerForGame(decoded, gameId)) {
    redirect(`/games/${gameId}`);
  }

  const { data: game, error } = await supabase
    .from("games")
    .select("id, name, status")
    .eq("id", gameId)
    .single();

  if (error || !game) {
    notFound();
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans flex flex-col">
      <header className="shrink-0 border-b border-amber-200/50 dark:border-zinc-700 px-4 py-3 safe-area-inset-top">
        <Link
          href={`/games/${gameId}/zone`}
          className="text-sm text-amber-800/70 dark:text-amber-200/70 hover:underline"
        >
          ← Back to zone
        </Link>
        <h1 className="mt-2 text-xl font-bold text-amber-900 dark:text-amber-100">
          Photo capture
        </h1>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          {(game as { name: string | null }).name || "Unnamed game"}
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-amber-200/50 dark:border-zinc-700 p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-amber-800 dark:text-amber-200">
            Photo capture screen — coming soon.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This is a placeholder. You’ll take photos here during the hiding phase.
          </p>
        </div>
      </main>
    </div>
  );
}
