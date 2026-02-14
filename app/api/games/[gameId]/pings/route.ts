import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: { player_id?: number; lat?: number; lng?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const playerId = body?.player_id;
  const lat = body?.lat;
  const lng = body?.lng;

  if (
    typeof playerId !== "number" ||
    typeof lat !== "number" ||
    typeof lng !== "number"
  ) {
    return NextResponse.json(
      { error: "Body must include player_id (number), lat (number), lng (number)" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("pings").insert({
    game_id: gameId,
    player_id: playerId,
    lat,
    lng,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
