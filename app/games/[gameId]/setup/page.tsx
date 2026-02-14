import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import type { Game } from "@/lib/types";
import { SetupClient } from "./SetupClient";

type Props = { params: Promise<{ gameId: string }> };

export default async function SetupPage({ params }: Props) {
  const { gameId } = await params;

  // Fetch game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    notFound();
  }

  // Get current player from cookie
  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const currentPlayer = getPlayerForGame(decoded, gameId);

  // If the user hasn't joined this game, send them to the join page
  if (!currentPlayer) {
    redirect(`/join/${gameId}`);
  }

  return (
    <SetupClient
      gameId={gameId}
      gameName={(game as Game).name || "Unnamed game"}
      playerId={currentPlayer.id}
      playerName={currentPlayer.name}
    />
  );
}
