import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/map-utils";

/**
 * POST /api/games/[gameId]/radar
 * Body: { lat, lng, targetPlayerId, distanceMeters }
 * Returns whether the target player's hiding photo location is within the given distance.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: {
    lat?: number;
    lng?: number;
    targetPlayerId?: number;
    distanceMeters?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lat, lng, targetPlayerId, distanceMeters: radiusMeters } = body;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof targetPlayerId !== "number" ||
    typeof radiusMeters !== "number" ||
    radiusMeters <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Body must include lat (number), lng (number), targetPlayerId (number), distanceMeters (positive number)",
      },
      { status: 400 }
    );
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, hiding_photo")
    .eq("game_id", gameId)
    .eq("id", targetPlayerId)
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      { error: "Target player not found" },
      { status: 404 }
    );
  }

  const photoId = (player as { hiding_photo: number | null }).hiding_photo;
  if (photoId == null) {
    return NextResponse.json({
      withinDistance: false,
      distanceMeters: null,
      error: "Target has no hiding photo",
    });
  }

  // Use only the photo row's stored latitude/longitude (set at capture time by the upload API).
  // We do not read EXIF or any other source.
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("latitude, longitude")
    .eq("id", photoId)
    .single();

  if (photoError || !photo) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  const photoLat = (photo as { latitude: number | null }).latitude;
  const photoLng = (photo as { longitude: number | null }).longitude;

  if (photoLat == null || photoLng == null) {
    return NextResponse.json({
      withinDistance: false,
      distanceMeters: null,
      error: "Photo has no location",
    });
  }

  const actualMeters = distanceMeters(lat, lng, photoLat, photoLng);
  const withinDistance = actualMeters <= radiusMeters;

  return NextResponse.json({
    withinDistance,
    distanceMeters: Math.round(actualMeters),
  });
}
