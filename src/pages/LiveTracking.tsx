import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck, Clock, Navigation } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:linear-gradient(135deg,hsl(152,55%,33%),hsl(80,50%,48%));width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🚛</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

// Simulated route points (Mumbai area)
const routePoints: [number, number][] = [
  [19.076, 72.8777],
  [19.078, 72.878],
  [19.080, 72.879],
  [19.082, 72.880],
  [19.084, 72.882],
  [19.086, 72.883],
  [19.088, 72.885],
  [19.090, 72.886],
  [19.092, 72.888],
  [19.094, 72.889],
  [19.096, 72.890],
  [19.098, 72.891],
];

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return null;
}

const vehicles = [
  { id: "GV-01", driver: "Ramesh K.", area: "Andheri West", status: "Active" },
  { id: "GV-02", driver: "Suresh P.", area: "Bandra East", status: "Active" },
  { id: "GV-03", driver: "Mohan R.", area: "Juhu", status: "Idle" },
];

export default function LiveTracking() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [eta, setEta] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % routePoints.length;
        setEta(Math.max(1, 12 - next));
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const position = routePoints[currentIndex];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Live Vehicle Tracking</h1>
          <p className="text-muted-foreground mt-1">Track garbage collection vehicles in real-time.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border eco-shadow" style={{ height: "500px" }}>
            <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline positions={routePoints} pathOptions={{ color: "hsl(152,55%,33%)", weight: 4, opacity: 0.6, dashArray: "8,8" }} />
              <Marker position={position} icon={truckIcon}>
                <Popup>
                  <strong>Vehicle GV-01</strong><br />
                  Driver: Ramesh K.<br />
                  ETA: {eta} min
                </Popup>
              </Marker>
              <MapUpdater position={position} />
            </MapContainer>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* ETA Card */}
            <motion.div
              key={eta}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="rounded-2xl eco-gradient p-5 text-primary-foreground"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-6 w-6" />
                <span className="font-display font-semibold">Estimated Arrival</span>
              </div>
              <p className="font-display text-4xl font-bold">{eta} min</p>
              <p className="text-sm text-primary-foreground/70 mt-1">Vehicle GV-01 approaching your area</p>
            </motion.div>

            {/* Vehicle List */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Active Vehicles</h3>
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg eco-gradient text-sm">🚛</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{v.id} — {v.driver}</p>
                      <p className="text-xs text-muted-foreground">{v.area}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
