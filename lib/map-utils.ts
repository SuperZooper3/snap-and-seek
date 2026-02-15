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

/** Point on line: 1 = one side, -1 = other side, 0 = on line (using perp dot) */
function pointSideOfLine(
  lat: number,
  lng: number,
  lineP1: { lat: number; lng: number },
  lineP2: { lat: number; lng: number }
): number {
  const ax = lineP1.lng;
  const ay = lineP1.lat;
  const bx = lineP2.lng;
  const by = lineP2.lat;
  const px = lng;
  const py = lat;
  const perpX = -(by - ay);
  const perpY = bx - ax;
  const apx = px - ax;
  const apy = py - ay;
  const d = apx * perpX + apy * perpY;
  if (d > 1e-12) return 1;
  if (d < -1e-12) return -1;
  return 0;
}

/** Intersection of segment (a,b) with infinite line through (lineP1, lineP2), or null */
function segmentLineIntersection(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  lineP1: { lat: number; lng: number },
  lineP2: { lat: number; lng: number }
): { lat: number; lng: number } | null {
  const x1 = lineP1.lng;
  const y1 = lineP1.lat;
  const x2 = lineP2.lng;
  const y2 = lineP2.lat;
  const x3 = a.lng;
  const y3 = a.lat;
  const x4 = b.lng;
  const y4 = b.lat;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-15) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (u >= -1e-9 && u <= 1 + 1e-9) {
    return { lat: y1 + t * (y2 - y1), lng: x1 + t * (x2 - x1) };
  }
  return null;
}

/** Clip polygon (closed list of points) by half-plane: keep points on side where sideOfLine === keepSide (1 or -1) */
function clipPolygonByHalfPlane(
  polygon: { lat: number; lng: number }[],
  lineP1: { lat: number; lng: number },
  lineP2: { lat: number; lng: number },
  keepSide: 1 | -1
): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const sideA = pointSideOfLine(a.lat, a.lng, lineP1, lineP2);
    const sideB = pointSideOfLine(b.lat, b.lng, lineP1, lineP2);
    const aIn = sideA === 0 || sideA === keepSide;
    const bIn = sideB === 0 || sideB === keepSide;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const pt = segmentLineIntersection(a, b, lineP1, lineP2);
      if (pt) out.push(pt);
    }
  }
  return out;
}

/**
 * Perpendicular bisector of segment (start -> end).
 * Returns two points on the bisector line, far enough apart to span the zone (for drawing).
 */
export function perpendicularBisector(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  scaleDeg = 0.02
): [{ lat: number; lng: number }, { lat: number; lng: number }] {
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;
  const perpLat = -dLng;
  const perpLng = dLat;
  const len = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1;
  const nLat = perpLat / len;
  const nLng = perpLng / len;
  return [
    { lat: midLat - scaleDeg * nLat, lng: midLng - scaleDeg * nLng },
    { lat: midLat + scaleDeg * nLat, lng: midLng + scaleDeg * nLng },
  ];
}

/**
 * Zone circle (polygon) intersected with a half-plane: the part of the zone on one side of the bisector line.
 * Used to shade "hider is not here" for thermometer hints.
 * lineP1, lineP2 = bisector line (from perpendicularBisector).
 * startLat, startLng = start point of the thermometer segment (used to identify which half is "start side").
 * shadeStartSide = true to return the polygon on the start side (for "hotter" we shade start side); false for end side.
 */
export function zoneHalfPlanePolygon(
  zoneCenterLat: number,
  zoneCenterLng: number,
  zoneRadiusMeters: number,
  lineP1: { lat: number; lng: number },
  lineP2: { lat: number; lng: number },
  startLat: number,
  startLng: number,
  shadeStartSide: boolean,
  circlePoints = 64
): { lat: number; lng: number }[] {
  const startSide = pointSideOfLine(startLat, startLng, lineP1, lineP2);
  const keepSide: 1 | -1 = shadeStartSide
    ? (startSide === 0 ? 1 : (startSide as 1 | -1))
    : (startSide === 0 ? -1 : (startSide === 1 ? -1 : 1));
  const zonePath = circleToPolygonPoints(
    zoneCenterLat,
    zoneCenterLng,
    zoneRadiusMeters,
    circlePoints
  );
  return clipPolygonByHalfPlane(zonePath, lineP1, lineP2, keepSide);
}
