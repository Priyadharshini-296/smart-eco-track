import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Search, CheckCircle, Bell } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,hsl(152,55%,33%),hsl(80,50%,48%));width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🚛</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "",
});

const homeIcon = new L.DivIcon({
  html: '<div style="background:hsl(0,72%,51%);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

function generateRoute(center: [number, number], points = 15): [number, number][] {
  const route: [number, number][] = [];
  const startLat = center[0] + (Math.random() - 0.5) * 0.04;
  const startLng = center[1] + (Math.random() - 0.5) * 0.04;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const lat = startLat + (center[0] - startLat) * t + (Math.random() - 0.5) * 0.002;
    const lng = startLng + (center[1] - startLng) * t + (Math.random() - 0.5) * 0.002;
    route.push([lat, lng]);
  }
  route.push(center);
  return route;
}

function MapUpdater({ position, zoom }: { position: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom || map.getZoom(), { animate: true });
  }, [position, zoom, map]);
  return null;
}

export default function LiveTracking() {
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [searching, setSearching] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = routePoints.length;
  const eta = isTracking && !arrived ? Math.max(0, Math.round((totalSteps - currentIndex - 1) * 0.3)) : 0;

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    setArrived(false);
    setCurrentIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data.length === 0) {
        toast.error("Address not found. Try a more specific location.");
        setSearching(false);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const loc: [number, number] = [lat, lon];
      setUserLocation(loc);
      const route = generateRoute(loc);
      setRoutePoints(route);
      setIsTracking(true);
      toast.success(`Location found: ${data[0].display_name.split(",").slice(0, 3).join(",")}`);
    } catch {
      toast.error("Failed to search. Check your connection.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!isTracking || arrived || routePoints.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= routePoints.length - 1) {
          setArrived(true);
          setIsTracking(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return routePoints.length - 1;
        }
        return next;
      });
    }, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTracking, arrived, routePoints]);

  useEffect(() => {
    if (arrived) {
      toast.success("🚛 Vehicle has arrived at your location!", { duration: 8000, icon: "🎉" });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("EcoGuard: Vehicle Arrived!", { body: "The garbage collection vehicle has reached your location.", icon: "/favicon.ico" });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") new Notification("EcoGuard: Vehicle Arrived!", { body: "The garbage collection vehicle has reached your location." });
        });
      }
    }
  }, [arrived]);

  const truckPosition = routePoints.length > 0 ? routePoints[currentIndex] : null;
  const defaultCenter: [number, number] = userLocation || [20.5937, 78.9629];
  const defaultZoom = userLocation ? 15 : 5;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Live Vehicle Tracking</h1>
          <p className="text-muted-foreground mt-1">Enter your address to track a nearby garbage vehicle.</p>
        </div>

        {/* Address Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Enter your address (e.g., MG Road, Bangalore)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-12 bg-card border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} className="h-12 px-6 eco-gradient text-primary-foreground font-semibold">
            {searching ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : "Track"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border eco-shadow" style={{ height: "500px" }}>
            <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <Marker position={userLocation} icon={homeIcon}>
                  <Popup><strong>Your Location</strong></Popup>
                </Marker>
              )}
              {routePoints.length > 0 && (
                <Polyline positions={routePoints} pathOptions={{ color: "hsl(152,55%,33%)", weight: 4, opacity: 0.6, dashArray: "8,8" }} />
              )}
              {truckPosition && (
                <Marker position={truckPosition} icon={truckIcon}>
                  <Popup>
                    <strong>Vehicle GV-01</strong><br />
                    ETA: {eta} min
                  </Popup>
                </Marker>
              )}
              <MapUpdater position={truckPosition || defaultCenter} zoom={truckPosition ? 15 : defaultZoom} />
            </MapContainer>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {arrived ? (
                <motion.div key="arrived" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-primary p-5 text-primary-foreground">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-display font-semibold">Vehicle Arrived!</span>
                  </div>
                  <p className="font-display text-2xl font-bold">🎉 At your location</p>
                  <p className="text-sm text-primary-foreground/70 mt-1">Please bring your waste outside for collection.</p>
                </motion.div>
              ) : isTracking ? (
                <motion.div key="tracking" initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-2xl eco-gradient p-5 text-primary-foreground">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-6 w-6" />
                    <span className="font-display font-semibold">Estimated Arrival</span>
                  </div>
                  <p className="font-display text-4xl font-bold">{eta} min</p>
                  <p className="text-sm text-primary-foreground/70 mt-1">Vehicle GV-01 approaching your area</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-card border border-border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="font-display font-semibold text-foreground">Enter Address</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Type your address above and click Track to simulate a vehicle heading to your location.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification permission */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-5 w-5 text-secondary" />
                <span className="font-display font-semibold text-foreground text-sm">Notifications</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Get notified when the vehicle arrives.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission().then((p) => {
                      toast(p === "granted" ? "Notifications enabled!" : "Notifications blocked.");
                    });
                  }
                }}
              >
                Enable Notifications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
