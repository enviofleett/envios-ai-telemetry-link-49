
export class GeometryUtils {
  static isPointInPolygon(point: { lat: number; lng: number }, polygon: any): boolean {
    if (!polygon?.coordinates?.[0]) return false;
    
    const coordinates = polygon.coordinates[0];
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i][0];
      const yi = coordinates[i][1];
      const xj = coordinates[j][0];
      const yj = coordinates[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }
}
