import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_HIDING_DURATION_SECONDS, DEFAULT_POWERUP_CASTING_SECONDS, DEFAULT_THERMOMETER_THRESHOLD_METERS } from "@/lib/game-config";

export async function GET() {
  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(games ?? []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  const { data, error } = await supabase
    .from("games")
    .insert({
      name: name || null,
      status: "lobby",
      hiding_duration_seconds: DEFAULT_HIDING_DURATION_SECONDS,
      powerup_casting_duration_seconds: DEFAULT_POWERUP_CASTING_SECONDS,
      thermometer_threshold_meters: DEFAULT_THERMOMETER_THRESHOLD_METERS,
    })
    .select("id, name, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
