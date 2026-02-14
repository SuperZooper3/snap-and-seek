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

  // Get the target player's hint photos and unavailable types
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("tree_photo, building_photo, path_photo, unavailable_hint_photo_types")
    .eq("id", hiderId)
    .eq("game_id", gameId)
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      { error: "Target player not found" },
      { status: 404 }
    );
  }

  // If no specific photo type requested, return available photos (with photo) and unavailable-as-hint types
  if (!photoType) {
    const availablePhotos: { type: 'tree' | 'building' | 'path'; photoId?: number; unavailable?: boolean }[] = [];
    if (player.tree_photo) availablePhotos.push({ type: 'tree', photoId: player.tree_photo });
    if (player.building_photo) availablePhotos.push({ type: 'building', photoId: player.building_photo });
    if (player.path_photo) availablePhotos.push({ type: 'path', photoId: player.path_photo });
    const unavailable = (player.unavailable_hint_photo_types as string[] | null) ?? [];
    if (unavailable.includes('tree') && !availablePhotos.some(p => p.type === 'tree')) availablePhotos.push({ type: 'tree', unavailable: true });
    if (unavailable.includes('building') && !availablePhotos.some(p => p.type === 'building')) availablePhotos.push({ type: 'building', unavailable: true });
    if (unavailable.includes('path') && !availablePhotos.some(p => p.type === 'path')) availablePhotos.push({ type: 'path', unavailable: true });

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
  const unavailable = (player.unavailable_hint_photo_types as string[] | null) ?? [];

  // If this type is marked unavailable, return that as the hint (no photo)
  if (unavailable.includes(photoType)) {
    return NextResponse.json({ photoType, unavailable: true });
  }

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