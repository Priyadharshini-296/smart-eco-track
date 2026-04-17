// Tracking engine: vehicle assignment, route geometry, schedule simulation, ETA
import { supabase } from "@/integrations/supabase/client";

export type LatLng = [number, number];

export interface Vehicle {
  id: string;
  vehicle_code: string;
  driver_name: string | null;
  zone_id: string;
  depot_lat: number;
  depot_lng: number;
  start_time: string; // "HH:MM:SS"
  avg_speed_kmh: number;
  status: string;
}

export interface Zone {
  id: string;
  name: string;
  city: string | null;
  min_lat: number; max_lat: number;
  min_lng: number; max_lng: number;
  center_lat: number; center_lng: number;
}

export interface RouteStop {
  id: string;
  vehicle_id: string;
  stop_order: number;
  stop_name: string | null;
  lat: number;
  lng: number;
}

export type VehicleStatus = "not_started" | "en_route" | "approaching" | "arrived" | "completed";

// ---- Geo helpers ----
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pointInZone(p: LatLng, z: Zone): boolean {
  return p[0] >= z.min_lat && p[0] <= z.max_lat && p[1] >= z.min_lng && p[1] <= z.max_lng;
}

// ---- Data fetching ----
export async function fetchAllZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from("zones").select("*");
  if (error) throw error;
  return (data || []) as Zone[];
}

export async function fetchAllVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from("vehicles").select("*").eq("status", "active");
  if (error) throw error;
  return (data || []) as Vehicle[];
}

export async function fetchRouteStops(vehicleId: string): Promise<RouteStop[]> {
  const { data, error } = await supabase
    .from("vehicle_route_stops")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("stop_order", { ascending: true });
  if (error) throw error;
  return (data || []) as RouteStop[];
}

// ---- Smart assignment ----
export function assignVehicle(
  userLoc: LatLng,
  vehicles: Vehicle[],
  zones: Zone[],
): Vehicle | null {
  if (vehicles.length === 0) return null;
  // 1) Prefer vehicle whose zone bounding box contains the user
  const containingZones = zones.filter((z) => pointInZone(userLoc, z));
  const inZone = vehicles.filter((v) => containingZones.some((z) => z.id === v.zone_id));
  const pool = inZone.length > 0 ? inZone : vehicles;
  // 2) Among the pool, pick nearest depot
  return pool.reduce((best, v) => {
    const d = haversineKm(userLoc, [v.depot_lat, v.depot_lng]);
    const bd = haversineKm(userLoc, [best.depot_lat, best.depot_lng]);
    return d < bd ? v : best;
  }, pool[0]);
}

// ---- Route geometry ----
// Build full polyline: depot -> stops -> user (last leg appended)
export function buildRoutePath(vehicle: Vehicle, stops: RouteStop[], userLoc: LatLng): LatLng[] {
  const path: LatLng[] = [];
  // Stops are already ordered; first stop is depot
  for (const s of stops) path.push([s.lat, s.lng]);
  // Append user as the final destination if not already close to last stop
  const last = path[path.length - 1];
  if (!last || haversineKm(last, userLoc) > 0.05) path.push(userLoc);
  return path;
}

// Densify a polyline by inserting interpolated points so animation is smooth
export function densifyPath(path: LatLng[], maxSegmentKm = 0.15): LatLng[] {
  const dense: LatLng[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    dense.push(a);
    const segKm = haversineKm(a, b);
    const steps = Math.max(1, Math.ceil(segKm / maxSegmentKm));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      dense.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  dense.push(path[path.length - 1]);
  return dense;
}

// Cumulative distance along path (km)
export function cumulativeDistances(path: LatLng[]): number[] {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + haversineKm(path[i - 1], path[i]));
  return cum;
}

// ---- Schedule / progress ----
export interface ProgressInfo {
  status: VehicleStatus;
  positionIdx: number;        // index in densified path
  position: LatLng;
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  etaMinutes: number;
  startedAt: Date;
}

// Compute progress given current time, vehicle start time, speed, and densified path
export function computeProgress(
  now: Date,
  vehicle: Vehicle,
  densePath: LatLng[],
  cumKm: number[],
  userLoc: LatLng,
  demoStart?: Date | null,
): ProgressInfo {
  const totalKm = cumKm[cumKm.length - 1] || 0;
  const speed = Math.max(5, vehicle.avg_speed_kmh);

  // Determine effective start time
  let startedAt: Date;
  if (demoStart) {
    startedAt = demoStart;
  } else {
    const [h, m] = vehicle.start_time.split(":").map(Number);
    startedAt = new Date(now);
    startedAt.setHours(h, m, 0, 0);
  }

  const elapsedHrs = (now.getTime() - startedAt.getTime()) / 3_600_000;

  if (elapsedHrs <= 0) {
    return {
      status: "not_started",
      positionIdx: 0,
      position: densePath[0],
      distanceTraveledKm: 0,
      distanceRemainingKm: totalKm,
      totalDistanceKm: totalKm,
      etaMinutes: Math.round((totalKm / speed) * 60 + (-elapsedHrs) * 60),
      startedAt,
    };
  }

  const traveledKm = elapsedHrs * speed;
  if (traveledKm >= totalKm) {
    return {
      status: "completed",
      positionIdx: densePath.length - 1,
      position: densePath[densePath.length - 1],
      distanceTraveledKm: totalKm,
      distanceRemainingKm: 0,
      totalDistanceKm: totalKm,
      etaMinutes: 0,
      startedAt,
    };
  }

  // Find segment containing traveledKm
  let idx = 0;
  for (let i = 1; i < cumKm.length; i++) {
    if (cumKm[i] >= traveledKm) { idx = i; break; }
  }
  // Interpolate within segment for precise position
  const prevIdx = Math.max(0, idx - 1);
  const segStart = cumKm[prevIdx];
  const segEnd = cumKm[idx];
  const t = segEnd > segStart ? (traveledKm - segStart) / (segEnd - segStart) : 0;
  const a = densePath[prevIdx];
  const b = densePath[idx];
  const position: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  const remainingKm = totalKm - traveledKm;
  const etaMinutes = Math.max(0, Math.round((remainingKm / speed) * 60));
  const distanceToUserKm = haversineKm(position, userLoc);

  let status: VehicleStatus = "en_route";
  if (distanceToUserKm <= 0.3) status = "approaching";
  if (distanceToUserKm <= 0.05) status = "arrived";

  return {
    status,
    positionIdx: idx,
    position,
    distanceTraveledKm: traveledKm,
    distanceRemainingKm: remainingKm,
    totalDistanceKm: totalKm,
    etaMinutes,
    startedAt,
  };
}

// ---- Geocoding (Nominatim) ----
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
  );
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
