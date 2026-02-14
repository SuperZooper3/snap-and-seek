import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_HIDING_DURATION_SECONDS } from "@/lib/game-config";

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
    })
    .select("id, name, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
