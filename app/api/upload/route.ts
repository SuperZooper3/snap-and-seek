import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const BUCKET_NAME = "snap-and-seek-image";
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Reverse geocode lat/lng into a human-readable address via Google Geocoding API.
 * Returns null if the API key is missing or the request fails.
 */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === "OK" && data.results?.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Parse optional location fields
    const latStr = formData.get("latitude") as string | null;
    const lngStr = formData.get("longitude") as string | null;
    const accStr = formData.get("accuracy") as string | null;
    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;
    const accuracy = accStr != null ? parseFloat(accStr) : null;
    const hasLocation =
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude);

    // Parse optional game/player fields (used by the setup page)
    const gameId = (formData.get("game_id") as string | null) || null;
    const playerIdStr = formData.get("player_id") as string | null;
    const playerId = playerIdStr ? parseInt(playerIdStr, 10) : null;

    // Reverse geocode if we have coordinates
    let locationName: string | null = null;
    if (hasLocation) {
      locationName = await reverseGeocode(latitude!, longitude!);
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Insert record into photos table (with location + game context if available)
    const { data: photoRecord, error: dbError } = await supabase
      .from("photos")
      .insert({
        url: publicUrl,
        storage_path: fileName,
        ...(hasLocation && {
          latitude,
          longitude,
          location_name: locationName,
          ...(accuracy != null && !isNaN(accuracy) && accuracy >= 0 && { accuracy }),
        }),
        ...(gameId && { game_id: gameId }),
        ...(playerId && { player_id: playerId }),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      return NextResponse.json(
        { error: `Failed to save photo record: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: photoRecord,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
