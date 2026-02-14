"use client";

import { useJsApiLoader } from "@react-google-maps/api";

/**
 * Single Google Maps loader for the whole app.
 * All map components must use useGoogleMapsLoader() so the script is loaded
 * once with the same options (avoids "Loader must not be called again with different options").
 */
const LOADER_ID = "google-maps-snap-and-seek";

export function useGoogleMapsLoader() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return useJsApiLoader({
    id: LOADER_ID,
    googleMapsApiKey: apiKey,
  });
}
