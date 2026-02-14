import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  MIN_HIDING_DURATION_SECONDS,
  MAX_HIDING_DURATION_SECONDS,
  MIN_POWERUP_CASTING_SECONDS,
  MAX_POWERUP_CASTING_SECONDS,
  MIN_THERMOMETER_THRESHOLD_METERS,
  MAX_THERMOMETER_THRESHOLD_METERS,
} from "@/lib/game-config";

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
  const hidingDurationSeconds = body?.hiding_duration_seconds;
  const powerupCastingSeconds = body?.powerup_casting_duration_seconds;
  const thermometerThresholdMeters = body?.thermometer_threshold_meters;

  const isZoneUpdate =
    typeof zoneCenterLat === "number" &&
    typeof zoneCenterLng === "number" &&
    typeof zoneRadiusMeters === "number";

  const isStartHiding = status === "hiding";
  const isStartSeeking = status === "seeking";
  const isHidingDurationUpdate =
    typeof hidingDurationSeconds === "number" &&
    hidingDurationSeconds >= MIN_HIDING_DURATION_SECONDS &&
    hidingDurationSeconds <= MAX_HIDING_DURATION_SECONDS;

  const isPowerupCastingUpdate =
    typeof powerupCastingSeconds === "number" &&
    powerupCastingSeconds >= MIN_POWERUP_CASTING_SECONDS &&
    powerupCastingSeconds <= MAX_POWERUP_CASTING_SECONDS;

  const isThermometerThresholdUpdate =
    typeof thermometerThresholdMeters === "number" &&
    thermometerThresholdMeters >= MIN_THERMOMETER_THRESHOLD_METERS &&
    thermometerThresholdMeters <= MAX_THERMOMETER_THRESHOLD_METERS;

  const validUpdate =
    isZoneUpdate ||
    isStartHiding ||
    isStartSeeking ||
    isHidingDurationUpdate ||
    isPowerupCastingUpdate ||
    isThermometerThresholdUpdate;

  if (!validUpdate) {
    return NextResponse.json(
      {
        error:
          "Send zone (zone_center_lat, zone_center_lng, zone_radius_meters), " +
          `status: 'hiding' | 'seeking', hiding_duration_seconds (${MIN_HIDING_DURATION_SECONDS}–${MAX_HIDING_DURATION_SECONDS}), ` +
          `or powerup_casting_duration_seconds (${MIN_POWERUP_CASTING_SECONDS}–${MAX_POWERUP_CASTING_SECONDS}), ` +
          `or thermometer_threshold_meters (${MIN_THERMOMETER_THRESHOLD_METERS}–${MAX_THERMOMETER_THRESHOLD_METERS})`,
      },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (isZoneUpdate) {
    updates.zone_center_lat = zoneCenterLat;
    updates.zone_center_lng = zoneCenterLng;
    updates.zone_radius_meters = zoneRadiusMeters;
  }
  if (isHidingDurationUpdate) {
    updates.hiding_duration_seconds = hidingDurationSeconds;
  }
  if (isPowerupCastingUpdate) {
    updates.powerup_casting_duration_seconds = powerupCastingSeconds;
  }
  if (isThermometerThresholdUpdate) {
    updates.thermometer_threshold_meters = thermometerThresholdMeters;
  }
  if (isStartHiding) {
    updates.status = "hiding";
    updates.hiding_started_at = new Date().toISOString();
  }
  if (isStartSeeking) {
    updates.status = "seeking";
    // Only set seeking_started_at when starting seeking for the first time (don't reset if already seeking).
    const { data: currentGame } = await supabase
      .from("games")
      .select("status, seeking_started_at")
      .eq("id", gameId)
      .single();
    const alreadySeeking =
      (currentGame as { status: string | null } | null)?.status === "seeking" &&
      (currentGame as { seeking_started_at: string | null })?.seeking_started_at != null;
    if (!alreadySeeking) {
      updates.seeking_started_at = new Date().toISOString();
    }
  }

  if (isStartHiding) {
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
