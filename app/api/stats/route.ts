import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Public stats for the home page. Returns only aggregate counts;
 * does not expose games list or other data. Uses service role server-side only.
 */
export async function GET() {
  const [gamesResult, photosResult, playersResult] = await Promise.all([
    supabase.from("games").select("*", { count: "exact", head: true }),
    supabase.from("photos").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
  ]);

  if (gamesResult.error) {
    return NextResponse.json(
      { error: gamesResult.error.message },
      { status: 500 }
    );
  }
  if (photosResult.error) {
    return NextResponse.json(
      { error: photosResult.error.message },
      { status: 500 }
    );
  }
  if (playersResult.error) {
    return NextResponse.json(
      { error: playersResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    gamesPlayed: gamesResult.count ?? 0,
    snapsTaken: photosResult.count ?? 0,
    playersJoined: playersResult.count ?? 0,
  });
}
