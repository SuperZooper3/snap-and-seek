import Link from "next/link";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { BackArrowIcon } from "@/components/BackArrowIcon";
import { supabase } from "@/lib/supabase";
import { getPlayerForGame, PLAYER_COOKIE_NAME } from "@/lib/player-cookie";
import type { Game, Player } from "@/lib/types";
import { getHidingDurationSeconds, getPowerupCastingSeconds, getThermometerThresholdMeters } from "@/lib/game-config";
import { GameActions } from "./GameActions";
import { PlayerList } from "./PlayerList";
import { GamePageRefresh } from "./GamePageRefresh";

type Props = {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, "");
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export default async function GamePage({ params, searchParams }: Props) {
  const { gameId } = await params;
  const search = await searchParams;
  const zoneRequired = search?.zone_required === "1";

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    notFound();
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  const joinUrl = `${await getBaseUrl()}/join/${gameId}`;

  const zone =
    game.zone_center_lat != null &&
    game.zone_center_lng != null &&
    game.zone_radius_meters != null
      ? {
          center_lat: game.zone_center_lat as number,
          center_lng: game.zone_center_lng as number,
          radius_meters: game.zone_radius_meters as number,
        }
      : null;

  const cookieStore = await cookies();
  const playersCookie = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const decoded = playersCookie ? decodeURIComponent(playersCookie) : undefined;
  const currentPlayer = getPlayerForGame(decoded, gameId);

  return (
    <div className="min-h-screen min-h-[100dvh] font-sans" style={{ background: "var(--background)" }}>
      <GamePageRefresh />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-16 pb-safe">
        <header className="mb-10">
          <Link href="/" className="btn-ghost inline-flex items-center gap-1.5">
            <BackArrowIcon />
            Create game
          </Link>
          <h1 className="mt-4 text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            {(game as Game).name || "Unnamed game"}
          </h1>
        </header>

        {zoneRequired && (
          <div
            className="mb-6 sketch-card p-4 text-sm"
            style={{
              background: "var(--pastel-warn)",
              borderColor: "var(--pastel-border)",
              color: "var(--pastel-ink)",
            }}
          >
            <strong>Set the play area first.</strong> Open &quot;Set game zone&quot; and choose the map area before starting the hiding phase.
          </div>
        )}
        <section className="sketch-card p-6 space-y-6">
          <GameActions
            gameId={gameId}
            status={(game as Game).status}
            joinUrl={joinUrl}
            playerCount={(players as Player[])?.length ?? 0}
            zone={zone}
            currentPlayer={currentPlayer}
            hidingDurationSeconds={getHidingDurationSeconds(
              (game as Game).hiding_duration_seconds
            )}
            powerupCastingSeconds={getPowerupCastingSeconds(
              (game as Game).powerup_casting_duration_seconds
            )}
            thermometerThresholdMeters={getThermometerThresholdMeters(
              (game as Game).thermometer_threshold_meters
            )}
          />

          {zone && !currentPlayer && (
            <Link
              href={`/games/${gameId}/god`}
              className="btn-pastel-lavender touch-manipulation block w-full text-center"
            >
              God mode — view all positions on map
            </Link>
          )}

          <PlayerList
            gameId={gameId}
            players={(players as Player[]) ?? []}
            currentPlayer={currentPlayer}
          />
        </section>
      </main>
    </div>
  );
}
