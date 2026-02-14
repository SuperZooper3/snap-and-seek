import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const body = await request.json().catch(() => ({}));
  const status = body?.status;
  const zoneCenterLat = body?.zone_center_lat;
  const zoneCenterLng = body?.zone_center_lng;
  const zoneRadiusMeters = body?.zone_radius_meters;

  const isZoneUpdate =
    typeof zoneCenterLat === "number" &&
    typeof zoneCenterLng === "number" &&
    typeof zoneRadiusMeters === "number";

  const isStartGame = status === "hiding";

  if (!isZoneUpdate && !isStartGame) {
    return NextResponse.json(
      { error: "Send zone (zone_center_lat, zone_center_lng, zone_radius_meters) or status: 'hiding'" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (isZoneUpdate) {
    updates.zone_center_lat = zoneCenterLat;
    updates.zone_center_lng = zoneCenterLng;
    updates.zone_radius_meters = zoneRadiusMeters;
  }
  if (isStartGame) {
    updates.status = "hiding";
  }

  if (isStartGame) {
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, status, zone_center_lat, zone_center_lng, zone_radius_meters")
      .eq("id", gameId)
      .single();

    if (fetchError || !game) {
      return NextResponse.json(
        { error: fetchError?.message ?? "Game not found" },
        { status: fetchError ? 500 : 404 }
      );
    }

    const zoneSet =
      game.zone_center_lat != null &&
      game.zone_center_lng != null &&
      game.zone_radius_meters != null;

    if (!zoneSet) {
      return NextResponse.json(
        { error: "Game zone must be set before starting. Use Set game zone first." },
        { status: 400 }
      );
    }

    const { count, error: countError } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    if ((count ?? 0) < 2) {
      return NextResponse.json(
        { error: "Need at least 2 players to start the game" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
