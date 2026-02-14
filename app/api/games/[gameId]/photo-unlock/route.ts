import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/games/[gameId]/photo-unlock
 * Get available hint photos for a target player or unlock a specific photo
 * Body: { hiderId, photoType? } 
 * If photoType provided, returns the photo URL
 * If photoType not provided, returns available photo types
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  let body: {
    hiderId?: number;
    photoType?: 'tree' | 'building' | 'path';
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hiderId, photoType } = body;
  if (typeof hiderId !== "number") {
    return NextResponse.json(
      { error: "Body must include hiderId (number)" },
      { status: 400 }
    );
  }

  // Get the target player's hint photos
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("tree_photo, building_photo, path_photo")
    .eq("id", hiderId)
    .eq("game_id", gameId)
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      { error: "Target player not found" },
      { status: 404 }
    );
  }

  // If no specific photo type requested, return available photos
  if (!photoType) {
    const availablePhotos = [];
    if (player.tree_photo) availablePhotos.push({ type: 'tree', photoId: player.tree_photo });
    if (player.building_photo) availablePhotos.push({ type: 'building', photoId: player.building_photo });
    if (player.path_photo) availablePhotos.push({ type: 'path', photoId: player.path_photo });

    return NextResponse.json({ availablePhotos });
  }

  // Validate photoType and get the corresponding photo ID
  if (!['tree', 'building', 'path'].includes(photoType)) {
    return NextResponse.json(
      { error: "photoType must be 'tree', 'building', or 'path'" },
      { status: 400 }
    );
  }

  const photoIdKey = `${photoType}_photo` as keyof typeof player;
  const photoId = player[photoIdKey];

  if (!photoId) {
    return NextResponse.json(
      { error: `No ${photoType} photo available for this player` },
      { status: 404 }
    );
  }

  // Get the photo URL
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("url")
    .eq("id", photoId)
    .single();

  if (photoError || !photo) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    photoType,
    photoId,
    photoUrl: photo.url
  });
}