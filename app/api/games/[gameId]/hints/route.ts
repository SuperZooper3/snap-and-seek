import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPowerupCastingSeconds } from "@/lib/game-config";
import type { RadarHintNote, ThermometerHintNote, PhotoHintNote } from "@/lib/types";

/**
 * POST /api/games/[gameId]/hints
 * Start casting a new hint/power-up
 * Body: { seekerId, hiderId, type, initialData? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: {
    seekerId?: number;
    hiderId?: number;
    type?: 'radar' | 'thermometer' | 'photo';
    initialData?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { seekerId, hiderId, type, initialData } = body;
  if (
    typeof seekerId !== "number" ||
    typeof hiderId !== "number" ||
    !type ||
    !['radar', 'thermometer', 'photo'].includes(type)
  ) {
    return NextResponse.json(
      {
        error: "Body must include seekerId (number), hiderId (number), type ('radar' | 'thermometer' | 'photo')",
      },
      { status: 400 }
    );
  }

  // Get game's casting duration setting
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("powerup_casting_duration_seconds")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Thermometer: 0s cast (user already walked); other types use game setting
  const castingDuration =
    type === 'thermometer' ? 0 : getPowerupCastingSeconds(game.powerup_casting_duration_seconds);

  // Check if there's already an active hint between this seeker-hider pair
  const { data: existingHint } = await supabase
    .from("hints")
    .select("id, status")
    .eq("game_id", gameId)
    .eq("seeker_id", seekerId)
    .eq("hider_id", hiderId)
    .eq("status", "casting")
    .single();

  if (existingHint) {
    return NextResponse.json(
      { error: "Already have an active hint casting for this target" },
      { status: 400 }
    );
  }

  // Validate players exist in the game
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", gameId)
    .in("id", [seekerId, hiderId]);

  if (playersError || !players || players.length !== 2) {
    return NextResponse.json(
      { error: "Seeker or hider not found in this game" },
      { status: 404 }
    );
  }

  // Prepare initial note data based on hint type
  let note: string | null = null;
  if (initialData) {
    note = JSON.stringify(initialData);
  }

  // Create the hint record
  const { data: hint, error: hintError } = await supabase
    .from("hints")
    .insert({
      game_id: gameId,
      seeker_id: seekerId,
      hider_id: hiderId,
      type,
      note,
      casting_duration_seconds: castingDuration,
      status: "casting",
    })
    .select()
    .single();

  if (hintError) {
    return NextResponse.json(
      { error: "Failed to create hint" },
      { status: 500 }
    );
  }

  return NextResponse.json({ hint });
}

/**
 * GET /api/games/[gameId]/hints?seekerId=123&status=completed
 * Get hints for a game, optionally filtered by seeker and/or status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const url = new URL(request.url);
  const seekerId = url.searchParams.get("seekerId");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("hints")
    .select(`
      id, game_id, seeker_id, hider_id, type, note, 
      casting_duration_seconds, status, created_at, completed_at,
      seeker:players!hints_seeker_id_fkey(name),
      hider:players!hints_hider_id_fkey(name)
    `)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (seekerId) {
    const seekerIdNum = parseInt(seekerId, 10);
    if (isNaN(seekerIdNum)) {
      return NextResponse.json({ error: "Invalid seekerId" }, { status: 400 });
    }
    query = query.eq("seeker_id", seekerIdNum);
  }

  if (status) {
    if (!['casting', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  const { data: hints, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch hints" }, { status: 500 });
  }

  return NextResponse.json({ hints });
}