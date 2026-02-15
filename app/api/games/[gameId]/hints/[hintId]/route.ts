import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { distanceMeters as distanceMetersFn } from "@/lib/map-utils";
import type { RadarHintNote, ThermometerHintNote, PhotoHintNote } from "@/lib/types";

/**
 * PATCH /api/games/[gameId]/hints/[hintId]
 * Complete or cancel a hint
 * Body: { status: 'completed' | 'cancelled', resultData?: any }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string; hintId: string }> }
) {
  const { gameId, hintId } = await params;

  let body: {
    status?: 'completed' | 'cancelled';
    resultData?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, resultData } = body;
  if (!status || !['completed', 'cancelled'].includes(status)) {
    return NextResponse.json(
      { error: "Status must be 'completed' or 'cancelled'" },
      { status: 400 }
    );
  }

  // Get the existing hint
  const { data: hint, error: hintError } = await supabase
    .from("hints")
    .select("*")
    .eq("id", hintId)
    .eq("game_id", gameId)
    .single();

  if (hintError || !hint) {
    return NextResponse.json({ error: "Hint not found" }, { status: 404 });
  }

  if (hint.status !== "casting") {
    return NextResponse.json(
      { error: "Hint is not in casting state" },
      { status: 400 }
    );
  }

  let updatedNote = hint.note;

  // If completing, process the result based on hint type
  if (status === "completed") {
    let noteData: Record<string, unknown> = {};
    try {
      noteData = hint.note ? JSON.parse(hint.note) : {};
    } catch {
      // Keep empty object if parse fails
    }

    if (hint.type === "radar") {
      // Radar center must be cast-time position (stored in note when hint was created). Do not overwrite with current position.
      const fromResult = resultData as { lat?: number; lng?: number; distanceMeters?: number } | undefined;
      const lat = fromResult?.lat ?? noteData.lat;
      const lng = fromResult?.lng ?? noteData.lng;
      const distanceMeters = fromResult?.distanceMeters ?? noteData.distanceMeters;
      if (typeof lat === "number" && typeof lng === "number" && typeof distanceMeters === "number") {
        // Get target's hiding photo location
        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("hiding_photo")
          .eq("id", hint.hider_id)
          .single();

        if (!playerError && player?.hiding_photo) {
          const { data: photo, error: photoError } = await supabase
            .from("photos")
            .select("latitude, longitude")
            .eq("id", player.hiding_photo)
            .single();

          if (!photoError && photo?.latitude != null && photo?.longitude != null) {
            const actualDistance = distanceMetersFn(lat, lng, photo.latitude, photo.longitude);
            const radarNote: RadarHintNote = {
              ...noteData,
              distanceMeters,
              result: {
                withinDistance: actualDistance <= distanceMeters,
                actualDistance: Math.round(actualDistance)
              }
            };
            updatedNote = JSON.stringify(radarNote);
          }
        }
      }
    } else if (hint.type === "thermometer" && resultData) {
      const { result, endLat, endLng } = resultData;
      if (typeof result === 'string' && ['hotter', 'colder', 'same'].includes(result)) {
        const thermoNote: ThermometerHintNote = {
          ...noteData,
          result: result as 'hotter' | 'colder' | 'same',
          ...(typeof endLat === 'number' && typeof endLng === 'number' && { endLat, endLng }),
        } as ThermometerHintNote;
        updatedNote = JSON.stringify(thermoNote);
      }
    } else if (hint.type === "photo" && resultData) {
      const { unlocked } = resultData;
      if (typeof unlocked === "boolean") {
        const photoNote = { ...noteData, unlocked } as PhotoHintNote;
        updatedNote = JSON.stringify(photoNote);
      }
    }
  }

  // Update the hint status
  const { data: updatedHint, error: updateError } = await supabase
    .from("hints")
    .update({
      status,
      note: updatedNote,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", hintId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update hint" },
      { status: 500 }
    );
  }

  return NextResponse.json({ hint: updatedHint });
}

/**
 * GET /api/games/[gameId]/hints/[hintId]
 * Get a specific hint by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string; hintId: string }> }
) {
  const { gameId, hintId } = await params;

  const { data: hint, error } = await supabase
    .from("hints")
    .select(`
      *, 
      seeker:players!hints_seeker_id_fkey(name),
      hider:players!hints_hider_id_fkey(name)
    `)
    .eq("id", hintId)
    .eq("game_id", gameId)
    .single();

  if (error || !hint) {
    return NextResponse.json({ error: "Hint not found" }, { status: 404 });
  }

  return NextResponse.json({ hint });
}