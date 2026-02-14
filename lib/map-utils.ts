/**
 * Approximate circle as polygon points (for use as polygon path or hole).
 * Radius in meters, center in lat/lng.
 */
export function circleToPolygonPoints(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  pointsCount = 64
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);

  for (let i = 0; i < pointsCount; i++) {
    const angle = (2 * Math.PI * i) / pointsCount;
    const dLat = (radiusMeters / metersPerDegLat) * Math.cos(angle);
    const dLng = (radiusMeters / metersPerDegLng) * Math.sin(angle);
    points.push({
      lat: centerLat + dLat,
      lng: centerLng + dLng,
    });
  }
  return points;
}

/**
 * Distance between two points in meters (Haversine approximation).
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * True if the user's accuracy circle is entirely outside the zone circle.
 */
export function isEntirelyOutsideZone(
  userLat: number,
  userLng: number,
  userAccuracyMeters: number,
  zoneCenterLat: number,
  zoneCenterLng: number,
  zoneRadiusMeters: number
): boolean {
  const d = distanceMeters(userLat, userLng, zoneCenterLat, zoneCenterLng);
  return d > zoneRadiusMeters + userAccuracyMeters;
}

/**
 * Bounding box (degrees) that contains the circle. Use with map.fitBounds().
 */
export function getBoundsForCircle(
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): { north: number; south: number; east: number; west: number } {
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);
  const dLat = radiusMeters / metersPerDegLat;
  const dLng = radiusMeters / metersPerDegLng;
  return {
    north: centerLat + dLat,
    south: centerLat - dLat,
    east: centerLng + dLng,
    west: centerLng - dLng,
  };
}

/**
 * Large rectangle in lat/lng that covers a wide area (for "outside zone" overlay).
 * Centered on (centerLat, centerLng), halfSideDeg is half the side in degrees.
 */
export function outerBounds(
  centerLat: number,
  centerLng: number,
  halfSideDeg = 2
): { lat: number; lng: number }[] {
  return [
    { lat: centerLat - halfSideDeg, lng: centerLng - halfSideDeg },
    { lat: centerLat - halfSideDeg, lng: centerLng + halfSideDeg },
    { lat: centerLat + halfSideDeg, lng: centerLng + halfSideDeg },
    { lat: centerLat + halfSideDeg, lng: centerLng - halfSideDeg },
  ];
}
