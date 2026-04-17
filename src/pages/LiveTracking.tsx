import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Search, CheckCircle, Bell, Truck, Navigation, Crosshair, PlayCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllVehicles, fetchAllZones, fetchRouteStops,
  assignVehicle, buildRoutePath, densifyPath, cumulativeDistances,
  computeProgress, geocodeAddress, reverseGeocode, makeNearbyRoute, haversineKm,
  type Vehicle, type Zone, type RouteStop, type LatLng, type ProgressInfo,
} from "@/lib/tracking";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,hsl(152,55%,33%),hsl(80,50%,48%));width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-size:20px;">🚛</div>',
  iconSize: [40, 40], iconAnchor: [20, 20], className: "",
});
const homeIcon = new L.DivIcon({
  html: '<div style="background:hsl(0,72%,51%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">📍</div>',
  iconSize: [32, 32], iconAnchor: [16, 16], className: "",
});
const depotIcon = new L.DivIcon({
  html: '<div style="background:hsl(220,15%,30%);width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏭</div>',
  iconSize: [28, 28], iconAnchor: [14, 14], className: "",
});
const stopIcon = new L.DivIcon({
  html: '<div style="background:hsl(80,50%,48%);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7], className: "",
});

function MapUpdater({ position, zoom }: { position: LatLng; zoom?: number }) {
  const map = useMap();
  useEffect(() => { map.setView(position, zoom || map.getZoom(), { animate: true }); }, [position, zoom, map]);
  return null;
}

export default function LiveTracking() {
  const { t } = useLanguage();
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [resolving, setResolving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);

  const [demoMode, setDemoMode] = useState(false);
  const [demoStart, setDemoStart] = useState<Date | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [now, setNow] = useState(new Date());
  const arrivedNotifiedRef = useRef(false);
  const startedNotifiedRef = useRef(false);
  const approachNotifiedRef = useRef(false);

  // Load reference data + saved profile address
  useEffect(() => {
    (async () => {
      try {
        const [z, v] = await Promise.all([fetchAllZones(), fetchAllVehicles()]);
        setZones(z); setVehicles(v);
      } catch (e) { console.error(e); }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles").select("address, address_lat, address_lng").eq("id", user.id).maybeSingle();
        if (prof?.address_lat && prof?.address_lng) {
          setUserLocation([Number(prof.address_lat), Number(prof.address_lng)]);
          setAddress(prof.address || "");
        } else {
          // Try browser geolocation
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const loc: LatLng = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(loc);
                const name = await reverseGeocode(loc[0], loc[1]);
                setAddress(name);
              },
              () => {/* user denied; they can enter manually */},
              { timeout: 5000 },
            );
          }
        }
      }
      setProfileLoaded(true);
    })();
  }, []);

  // Assign vehicle whenever user location or vehicle list changes
  useEffect(() => {
    if (!userLocation || vehicles.length === 0) return;
    const assigned = assignVehicle(userLocation, vehicles, zones);
    setVehicle(assigned);
    if (assigned) {
      fetchRouteStops(assigned.id).then(setStops).catch(console.error);
    }
  }, [userLocation, vehicles, zones]);

  // Build a virtual depot 10–20 km from the user, plus intermediate stops along the way
  const nearby = useMemo(() => {
    if (!vehicle || !userLocation) return null;
    return makeNearbyRoute(userLocation, vehicle.id, 5, 10, 20);
  }, [vehicle, userLocation]);

  // Build dense path + cumulative distances (depot -> intermediate stops -> user)
  const { densePath, cumKm, fullPath } = useMemo(() => {
    if (!vehicle || !userLocation || !nearby)
      return { densePath: [] as LatLng[], cumKm: [] as number[], fullPath: [] as LatLng[] };
    const full: LatLng[] = [nearby.depot, ...nearby.stops, userLocation];
    const dense = densifyPath(full, 0.1);
    return { densePath: dense, cumKm: cumulativeDistances(dense), fullPath: full };
  }, [vehicle, nearby, userLocation]);

  // Tick every second; recompute progress
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!vehicle || densePath.length === 0 || !userLocation) { setProgress(null); return; }
    const p = computeProgress(now, vehicle, densePath, cumKm, userLocation, demoMode ? demoStart : null);
    setProgress(p);
  }, [now, vehicle, densePath, cumKm, userLocation, demoMode, demoStart]);

  // Notifications
  useEffect(() => {
    if (!progress) return;
    if (progress.status === "en_route" && !startedNotifiedRef.current) {
      startedNotifiedRef.current = true;
      toast(`🚛 ${vehicle?.vehicle_code} ${t("tracking.started") || "started its route"}`);
    }
    if (progress.status === "approaching" && !approachNotifiedRef.current) {
      approachNotifiedRef.current = true;
      toast.success(`🚨 ${t("tracking.approaching") || "Vehicle is approaching"}`, { duration: 6000 });
      pushBrowserNotif("Vehicle approaching", `${vehicle?.vehicle_code} is near your location.`);
    }
    if ((progress.status === "arrived" || progress.status === "completed") && !arrivedNotifiedRef.current) {
      arrivedNotifiedRef.current = true;
      toast.success(`🎉 ${t("tracking.vehicleArrivedToast") || "Vehicle has arrived!"}`, { duration: 8000 });
      pushBrowserNotif("Vehicle arrived", "Bring your waste out for collection.");
    }
  }, [progress, vehicle, t]);

  // Reset notification flags when vehicle/demo changes
  useEffect(() => {
    arrivedNotifiedRef.current = false;
    startedNotifiedRef.current = false;
    approachNotifiedRef.current = false;
  }, [vehicle?.id, demoStart, demoMode]);

  function pushBrowserNotif(title: string, body: string) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(`EcoGuard: ${title}`, { body, icon: "/favicon.ico" });
  }

  const handleSearch = async () => {
    if (!address.trim()) return;
    setResolving(true);
    try {
      const r = await geocodeAddress(address);
      if (!r) { toast.error(t("tracking.addressNotFound") || "Address not found"); return; }
      const loc: LatLng = [r.lat, r.lng];
      setUserLocation(loc);
      toast.success(`📍 ${r.displayName.split(",").slice(0, 3).join(",")}`);
      // Save to profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          address: r.displayName, address_lat: r.lat, address_lng: r.lng,
        }).eq("id", user.id);
      }
    } catch { toast.error(t("tracking.searchFailed") || "Search failed"); }
    finally { setResolving(false); }
  };

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        const name = await reverseGeocode(loc[0], loc[1]);
        setAddress(name);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from("profiles").update({
          address: name, address_lat: loc[0], address_lng: loc[1],
        }).eq("id", user.id);
        toast.success("Using your current location");
      },
      () => toast.error("Could not access location"),
    );
  };

  const startDemo = () => {
    setDemoMode(true);
    setDemoStart(new Date());
    toast("Demo mode: vehicle starting now");
  };

  const defaultCenter: LatLng = userLocation || [12.9716, 77.5946];
  const defaultZoom = userLocation ? 14 : 11;
  const truckPos = progress?.position;

  const statusMeta = (() => {
    if (!progress) return { label: t("tracking.enterAddress") || "Enter your address", color: "bg-muted text-muted-foreground", icon: MapPin };
    switch (progress.status) {
      case "not_started": return { label: "Vehicle not started", color: "bg-muted text-muted-foreground", icon: Clock };
      case "en_route":    return { label: "Vehicle en route",     color: "bg-secondary text-secondary-foreground", icon: Truck };
      case "approaching": return { label: "Approaching your location", color: "bg-accent text-accent-foreground", icon: Navigation };
      case "arrived":     return { label: "Vehicle arrived",      color: "bg-primary text-primary-foreground", icon: CheckCircle };
      case "completed":   return { label: "Collection completed", color: "bg-primary text-primary-foreground", icon: CheckCircle };
    }
  })();
  const StatusIcon = statusMeta.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t("tracking.title") || "Live Garbage Tracking"}</h1>
            <p className="text-muted-foreground mt-1">{t("tracking.subtitle") || "Track your collection vehicle in real time"}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
            <Switch id="demo" checked={demoMode} onCheckedChange={(v) => { setDemoMode(v); if (v) setDemoStart(new Date()); else setDemoStart(null); }} />
            <Label htmlFor="demo" className="text-sm cursor-pointer">Demo mode</Label>
            {demoMode && (
              <Button size="sm" variant="ghost" onClick={startDemo} className="h-7 px-2">
                <PlayCircle className="h-4 w-4 mr-1" /> Restart
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("tracking.searchPlaceholder") || "Enter your address (e.g. Koramangala 4th Block, Bangalore)"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={resolving} className="h-12 px-6 eco-gradient text-primary-foreground font-semibold">
            {resolving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (t("tracking.track") || "Track")}
          </Button>
          <Button onClick={handleUseMyLocation} variant="outline" className="h-12">
            <Crosshair className="h-4 w-4 mr-2" /> Use my location
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border eco-shadow" style={{ height: "560px" }}>
            <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }} zoomControl>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {userLocation && (
                <Marker position={userLocation} icon={homeIcon}>
                  <Popup><strong>Your location</strong></Popup>
                </Marker>
              )}
              {nearby && (
                <Marker position={nearby.depot} icon={depotIcon}>
                  <Popup>
                    <strong>Depot</strong><br />{vehicle?.vehicle_code}<br />
                    {userLocation && `${haversineKm(nearby.depot, userLocation).toFixed(1)} km away`}
                  </Popup>
                </Marker>
              )}
              {nearby?.stops.map((s, i) => (
                <Marker key={i} position={s} icon={stopIcon}>
                  <Popup><strong>Stop {i + 1}</strong></Popup>
                </Marker>
              ))}
              {fullPath.length > 1 && (
                <Polyline positions={fullPath} pathOptions={{ color: "hsl(152,55%,33%)", weight: 4, opacity: 0.45, dashArray: "10,8" }} />
              )}
              {/* Traveled portion (solid) */}
              {progress && densePath.length > 1 && (
                <Polyline
                  positions={densePath.slice(0, Math.max(1, progress.positionIdx + 1))}
                  pathOptions={{ color: "hsl(152,55%,33%)", weight: 5, opacity: 0.95 }}
                />
              )}
              {truckPos && (
                <Marker position={truckPos} icon={truckIcon}>
                  <Popup>
                    <strong>{vehicle?.vehicle_code}</strong><br />
                    Driver: {vehicle?.driver_name}<br />
                    ETA: {progress?.etaMinutes} min
                  </Popup>
                </Marker>
              )}
              <MapUpdater position={truckPos || defaultCenter} zoom={truckPos ? 14 : defaultZoom} />
            </MapContainer>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={statusMeta.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-2xl p-5 ${statusMeta.color}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <StatusIcon className="h-6 w-6" />
                  <span className="font-display font-semibold">{statusMeta.label}</span>
                </div>
                {progress && progress.status !== "completed" && progress.status !== "arrived" && (
                  <>
                    <p className="font-display text-4xl font-bold">{progress.etaMinutes} <span className="text-base font-normal opacity-80">min</span></p>
                    <p className="text-sm opacity-80 mt-1">
                      {progress.distanceRemainingKm.toFixed(2)} km remaining
                    </p>
                  </>
                )}
                {progress?.status === "arrived" && (
                  <p className="text-sm opacity-90 mt-1">Bring your segregated waste out for collection.</p>
                )}
              </motion.div>
            </AnimatePresence>

            {vehicle && (
              <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-foreground">Assigned vehicle</span>
                  <Badge variant="secondary">{vehicle.vehicle_code}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Driver: <span className="text-foreground">{vehicle.driver_name || "—"}</span></div>
                  <div>Zone: <span className="text-foreground">{zones.find(z => z.id === vehicle.zone_id)?.name || "—"}</span></div>
                  <div>Start time: <span className="text-foreground">{vehicle.start_time.slice(0,5)}</span></div>
                  <div>Avg speed: <span className="text-foreground">{vehicle.avg_speed_kmh} km/h</span></div>
                  <div>Stops: <span className="text-foreground">{stops.length}</span></div>
                </div>
                {progress && progress.totalDistanceKm > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round((progress.distanceTraveledKm / progress.totalDistanceKm) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full eco-gradient transition-all" style={{ width: `${Math.min(100, (progress.distanceTraveledKm / progress.totalDistanceKm) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-5 w-5 text-secondary" />
                <span className="font-display font-semibold text-foreground text-sm">Notifications</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Get alerts when the vehicle starts, approaches, and arrives.</p>
              <Button variant="outline" size="sm" onClick={() => {
                if ("Notification" in window) Notification.requestPermission().then((p) =>
                  toast(p === "granted" ? "Notifications enabled!" : "Notifications blocked."));
              }}>
                Enable notifications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
