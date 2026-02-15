import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { circlesOverlap, LOCATION_CIRCLE_MIN_RADIUS_M } from "@/lib/map-utils";

/**
 * GET /api/games/[gameId]/submissions
 * Returns all submissions for the game.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data ?? [] });
}

/**
 * POST /api/games/[gameId]/submissions
 * Create a new submission. For now, always sets status to 'success'.
 * After inserting, checks if the seeker has found all other players (win condition).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const body = await request.json().catch(() => ({}));

  const seekerId: number | undefined = body?.seeker_id;
  const hiderId: number | undefined = body?.hider_id;
  const photoId: number | undefined = body?.photo_id;

  if (!seekerId || !hiderId) {
    return NextResponse.json(
      { error: "seeker_id and hider_id are required" },
      { status: 400 }
    );
  }

  // Reject submissions if game is already completed (someone already won)
  let currentGame: { status: string; winner_id?: number | null } | null = null;
  const gameWithWinner = await supabase
    .from("games")
    .select("status, winner_id")
    .eq("id", gameId)
    .single();
  if (gameWithWinner.error) {
    const msg = gameWithWinner.error.message ?? "";
    if (msg.includes("winner_id") || msg.includes("does not exist")) {
      const fallback = await supabase.from("games").select("status").eq("id", gameId).single();
      if (fallback.data) currentGame = { ...fallback.data, winner_id: null };
    }
  } else if (gameWithWinner.data) {
    currentGame = gameWithWinner.data as { status: string; winner_id?: number | null };
  }
  if (currentGame?.status === "completed" || currentGame?.winner_id != null) {
    return NextResponse.json(
      { error: "Game is already completed", winner_id: currentGame?.winner_id ?? null },
      { status: 409 }
    );
  }

  // Check for existing successful submission for this (seeker, hider) pair
  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("game_id", gameId)
    .eq("seeker_id", seekerId)
    .eq("hider_id", hiderId)
    .eq("status", "success")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Already submitted successfully for this target" },
      { status: 409 }
    );
  }

  // Insert submission as pending; we'll set success/fail from photo vs target location
  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      game_id: gameId,
      seeker_id: seekerId,
      hider_id: hiderId,
      ...(photoId ? { photo_id: photoId } : {}),
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // Resolve status from circle overlap: seeker's photo circle vs hider's hiding spot photo circle.
  // Each circle: center = photo lat/lng, radius = max(5m, photo accuracy). Hit if circles overlap.
  let resolvedStatus: "success" | "fail" = "fail";
  if (photoId) {
    const { data: submissionPhoto } = await supabase
      .from("photos")
      .select("latitude, longitude, accuracy")
      .eq("id", photoId)
      .single();

    const { data: hider } = await supabase
      .from("players")
      .select("hiding_photo")
      .eq("id", hiderId)
      .single();

    const hidingPhotoId = (hider as { hiding_photo: number | null } | null)?.hiding_photo ?? null;
    if (hidingPhotoId != null) {
      const { data: targetPhoto } = await supabase
        .from("photos")
        .select("latitude, longitude, accuracy")
        .eq("id", hidingPhotoId)
        .single();

      const subLat = (submissionPhoto as { latitude: number | null } | null)?.latitude;
      const subLng = (submissionPhoto as { longitude: number | null } | null)?.longitude;
      const subAcc = (submissionPhoto as { accuracy: number | null } | null)?.accuracy;
      const tgtLat = (targetPhoto as { latitude: number | null } | null)?.latitude;
      const tgtLng = (targetPhoto as { longitude: number | null } | null)?.longitude;
      const tgtAcc = (targetPhoto as { accuracy: number | null } | null)?.accuracy;

      if (
        subLat != null &&
        subLng != null &&
        !Number.isNaN(subLat) &&
        !Number.isNaN(subLng) &&
        tgtLat != null &&
        tgtLng != null &&
        !Number.isNaN(tgtLat) &&
        !Number.isNaN(tgtLng)
      ) {
        const subRadius = subAcc != null && !Number.isNaN(subAcc) && subAcc >= 0 ? subAcc : LOCATION_CIRCLE_MIN_RADIUS_M;
        const tgtRadius = tgtAcc != null && !Number.isNaN(tgtAcc) && tgtAcc >= 0 ? tgtAcc : LOCATION_CIRCLE_MIN_RADIUS_M;
        resolvedStatus = circlesOverlap(subLat, subLng, subRadius, tgtLat, tgtLng, tgtRadius) ? "success" : "fail";
      }
    }
  }

  await supabase
    .from("submissions")
    .update({ status: resolvedStatus })
    .eq("id", submission.id);

  const submissionWithStatus = { ...submission, status: resolvedStatus };

  // --- Win check: only when this submission is success and seeker has all success ---
  // Count distinct hiders this seeker has successfully found
  const { data: successfulSubmissions, error: countError } = await supabase
    .from("submissions")
    .select("hider_id")
    .eq("game_id", gameId)
    .eq("seeker_id", seekerId)
    .eq("status", "success");

  if (countError) {
    return NextResponse.json({ submission: submissionWithStatus, isWinner: false });
  }

  const distinctHiders = new Set(
    (successfulSubmissions ?? []).map((s: { hider_id: number }) => s.hider_id)
  );

  // Count total players in this game
  const { count: totalPlayers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  const neededFinds = (totalPlayers ?? 0) - 1; // everyone except yourself
  const isWinner =
    resolvedStatus === "success" &&
    neededFinds > 0 &&
    distinctHiders.size >= neededFinds;

  if (isWinner) {
    const finishedAt = new Date().toISOString();
    // Atomic: only set winner if no winner already exists (WHERE winner_id IS NULL).
    const updateResult = await supabase
      .from("games")
      .update({
        winner_id: seekerId,
        status: "completed",
        finished_at: finishedAt,
      })
      .eq("id", gameId)
      .is("winner_id", null)
      .select("winner_id")
      .single();

    const updated = updateResult.data;
    const updateError = updateResult.error;
    if (updateError && (updateError.message?.includes("winner_id") || updateError.message?.includes("does not exist"))) {
      return NextResponse.json({ submission: submissionWithStatus, isWinner: true });
    }
    if (updateError) {
      return NextResponse.json({ submission: submissionWithStatus, isWinner: false });
    }
    if (!updated || updated.winner_id !== seekerId) {
      // Another request may have set winner first; ensure game status is completed so it doesn't stay "seeking"
      await supabase
        .from("games")
        .update({ status: "completed", finished_at: finishedAt })
        .eq("id", gameId);
      return NextResponse.json({ submission: submissionWithStatus, isWinner: false });
    }
  }

  return NextResponse.json({ submission: submissionWithStatus, isWinner: false });
}
