export interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

export interface OptimizedTrail {
  points: TrailPoint[];
  simplificationLevel: number;
  totalDistance: number;
  averageSpeed: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface TrailOptimizationOptions {
  tolerance: number;
  maxPoints: number;
  minTimeGap: number; // seconds
  minDistance: number; // meters
  preserveShape: boolean;
}

export class TrailOptimizationService {
  private defaultOptions: TrailOptimizationOptions = {
    tolerance: 0.0001, // ~10 meters
    maxPoints: 1000,
    minTimeGap: 30, // 30 seconds
    minDistance: 50, // 50 meters
    preserveShape: true
  };

  private trailCache: Map<string, OptimizedTrail> = new Map();

  optimizeTrail(points: TrailPoint[], zoom: number, options?: Partial<TrailOptimizationOptions>): OptimizedTrail {
    const opts = { ...this.defaultOptions, ...options };
    
    // Adjust tolerance based on zoom level
    const zoomAdjustedTolerance = opts.tolerance * Math.pow(2, Math.max(0, 12 - zoom));
    
    const cacheKey = this.getCacheKey(points, zoom, opts);
    if (this.trailCache.has(cacheKey)) {
      return this.trailCache.get(cacheKey)!;
    }

    let optimized = [...points];

    // Step 1: Remove points that are too close in time or distance
    optimized = this.removeRedundantPoints(optimized, opts);

    // Step 2: Apply Douglas-Peucker simplification
    if (opts.preserveShape && optimized.length > 3) {
      optimized = this.douglasPeucker(optimized, zoomAdjustedTolerance);
    }

    // Step 3: Limit total points if still too many
    if (optimized.length > opts.maxPoints) {
      optimized = this.limitPoints(optimized, opts.maxPoints);
    }

    const result: OptimizedTrail = {
      points: optimized,
      simplificationLevel: 1 - (optimized.length / points.length),
      totalDistance: this.calculateTotalDistance(optimized),
      averageSpeed: this.calculateAverageSpeed(optimized),
      bounds: this.calculateBounds(optimized)
    };

    this.trailCache.set(cacheKey, result);
    return result;
  }

  private removeRedundantPoints(points: TrailPoint[], options: TrailOptimizationOptions): TrailPoint[] {
    if (points.length <= 2) return points;

    const filtered: TrailPoint[] = [points[0]]; // Always keep first point
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const previous = filtered[filtered.length - 1];
      
      const timeDiff = (current.timestamp - previous.timestamp) / 1000; // Convert to seconds
      const distance = this.calculateDistance(previous.lat, previous.lng, current.lat, current.lng);
      
      // Keep point if it meets time or distance criteria
      if (timeDiff >= options.minTimeGap || distance >= options.minDistance) {
        filtered.push(current);
      }
    }
    
    // Always keep last point
    if (points.length > 1) {
      filtered.push(points[points.length - 1]);
    }
    
    return filtered;
  }

  private douglasPeucker(points: TrailPoint[], tolerance: number): TrailPoint[] {
    if (points.length <= 2) return points;

    // Find the point with maximum distance from the line between first and last points
    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(
        points[i],
        points[0],
        points[points.length - 1]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const leftSegment = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightSegment = this.douglasPeucker(points.slice(maxIndex), tolerance);

      // Combine results, removing duplicate middle point
      return [...leftSegment.slice(0, -1), ...rightSegment];
    } else {
      // If max distance is within tolerance, return just endpoints
      return [points[0], points[points.length - 1]];
    }
  }

  private perpendicularDistance(point: TrailPoint, lineStart: TrailPoint, lineEnd: TrailPoint): number {
    const A = lineEnd.lat - lineStart.lat;
    const B = lineStart.lng - lineEnd.lng;
    const C = lineEnd.lng * lineStart.lat - lineStart.lng * lineEnd.lat;

    return Math.abs(A * point.lng + B * point.lat + C) / Math.sqrt(A * A + B * B);
  }

  private limitPoints(points: TrailPoint[], maxPoints: number): TrailPoint[] {
    if (points.length <= maxPoints) return points;

    const step = Math.floor(points.length / maxPoints);
    const limited: TrailPoint[] = [points[0]]; // Always keep first point

    for (let i = step; i < points.length - 1; i += step) {
      limited.push(points[i]);
    }

    // Always keep last point
    limited.push(points[points.length - 1]);

    return limited;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
  }

  private calculateTotalDistance(points: TrailPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += this.calculateDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }
    return total;
  }

  private calculateAverageSpeed(points: TrailPoint[]): number {
    if (points.length < 2) return 0;

    let totalSpeed = 0;
    let validPoints = 0;

    for (const point of points) {
      if (point.speed !== undefined) {
        totalSpeed += point.speed;
        validPoints++;
      }
    }

    return validPoints > 0 ? totalSpeed / validPoints : 0;
  }

  private calculateBounds(points: TrailPoint[]) {
    if (points.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = points[0].lat;
    let south = points[0].lat;
    let east = points[0].lng;
    let west = points[0].lng;

    for (const point of points) {
      north = Math.max(north, point.lat);
      south = Math.min(south, point.lat);
      east = Math.max(east, point.lng);
      west = Math.min(west, point.lng);
    }

    return { north, south, east, west };
  }

  private getCacheKey(points: TrailPoint[], zoom: number, options: TrailOptimizationOptions): string {
    const pointsHash = points.length > 0 ? 
      `${points[0].timestamp}-${points[points.length - 1].timestamp}-${points.length}` : 
      'empty';
    return `${pointsHash}-${zoom}-${JSON.stringify(options)}`;
  }

  clearCache() {
    this.trailCache.clear();
  }

  getCacheStats() {
    return {
      cacheSize: this.trailCache.size,
      memoryUsage: JSON.stringify([...this.trailCache.entries()]).length
    };
  }
}

export const trailOptimizationService = new TrailOptimizationService();
