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
