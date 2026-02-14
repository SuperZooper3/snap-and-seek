import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/map-utils";

/**
 * POST /api/games/[gameId]/thermometer
 * Calculate "hotter/colder" feedback based on thermometer hint data
 * Body: { hintId, currentLat, currentLng }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: {
    hintId?: string;
    currentLat?: number;
    currentLng?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hintId, currentLat, currentLng } = body;
  if (
    typeof hintId !== "string" ||
    typeof currentLat !== "number" ||
    typeof currentLng !== "number"
  ) {
    return NextResponse.json(
      {
        error: "Body must include hintId (string), currentLat (number), currentLng (number)",
      },
      { status: 400 }
    );
  }

  // Get the thermometer hint
  const { data: hint, error: hintError } = await supabase
    .from("hints")
    .select("*")
    .eq("id", hintId)
    .eq("game_id", gameId)
    .eq("type", "thermometer")
    .eq("status", "casting")
    .single();

  if (hintError || !hint) {
    return NextResponse.json(
      { error: "Thermometer hint not found or not active" },
      { status: 404 }
    );
  }

  // Parse the thermometer note data
  let noteData: any = {};
  try {
    noteData = hint.note ? JSON.parse(hint.note) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid hint note data" },
      { status: 400 }
    );
  }

  const { startLat, startLng, thresholdMeters, lastLat, lastLng } = noteData;
  if (
    typeof startLat !== "number" ||
    typeof startLng !== "number" ||
    typeof thresholdMeters !== "number"
  ) {
    return NextResponse.json(
      { error: "Thermometer hint missing start coordinates or threshold" },
      { status: 400 }
    );
  }

  // Get target's hiding photo location
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("hiding_photo")
    .eq("id", hint.hider_id)
    .single();

  if (playerError || !player?.hiding_photo) {
    return NextResponse.json(
      { error: "Target player or hiding photo not found" },
      { status: 404 }
    );
  }

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("latitude, longitude")
    .eq("id", player.hiding_photo)
    .single();

  if (photoError || !photo?.latitude || !photo?.longitude) {
    return NextResponse.json(
      { error: "Target photo location not found" },
      { status: 404 }
    );
  }

  // Calculate distances
  const distanceFromStart = distanceMeters(currentLat, currentLng, startLat, startLng);
  const distanceToTarget = distanceMeters(currentLat, currentLng, photo.latitude, photo.longitude);
  
  // Check if user is far enough from start to complete thermometer
  const canComplete = distanceFromStart >= thresholdMeters;

  let result: 'hotter' | 'colder' | 'same' | null = null;
  
  if (lastLat != null && lastLng != null && canComplete) {
    // Compare current distance to target vs last distance to target
    const lastDistanceToTarget = distanceMeters(lastLat, lastLng, photo.latitude, photo.longitude);
    const threshold = 2; // 2 meter threshold for "same"
    
    if (Math.abs(distanceToTarget - lastDistanceToTarget) <= threshold) {
      result = 'same';
    } else if (distanceToTarget < lastDistanceToTarget) {
      result = 'hotter';
    } else {
      result = 'colder';
    }
  }

  return NextResponse.json({
    distanceFromStart: Math.round(distanceFromStart),
    distanceToTarget: Math.round(distanceToTarget),
    canComplete,
    result,
    thresholdMeters
  });
}