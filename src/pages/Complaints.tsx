import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, MapPin, Clock, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

interface Complaint {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  photoName?: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-secondary/20 text-secondary-foreground",
  in_progress: "bg-accent/20 text-accent-foreground",
  completed: "bg-primary/20 text-primary",
};

const statusIcons: Record<string, typeof AlertCircle> = {
  pending: AlertCircle,
  in_progress: Loader2,
  completed: CheckCircle,
};

const demoComplaints: Complaint[] = [
  { id: "1", description: "Large garbage pile near bus stop", latitude: 19.076, longitude: 72.877, status: "pending", created_at: new Date().toISOString(), photoName: "garbage1.jpg" },
  { id: "2", description: "Overflowing community bin on 5th street", latitude: 19.082, longitude: 72.880, status: "in_progress", created_at: new Date(Date.now() - 86400000).toISOString(), photoName: "garbage2.jpg" },
  { id: "3", description: "Illegal dumping site cleared", latitude: 19.090, longitude: 72.886, status: "completed", created_at: new Date(Date.now() - 172800000).toISOString() },
];

export default function Complaints() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 19.076, lng: 72.877 })
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { toast.error(t("complaints.descRequired")); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    const newComplaint: Complaint = {
      id: String(Date.now()),
      description: description.trim(),
      latitude: location?.lat ?? 19.076,
      longitude: location?.lng ?? 72.877,
      status: "pending",
      created_at: new Date().toISOString(),
      photoName: photo?.name,
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    setDescription("");
    setPhoto(null);
    setLoading(false);
    toast.success(t("complaints.submitted"));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("complaints.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("complaints.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 rounded-2xl bg-card border border-border p-6 eco-shadow">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">{t("complaints.newComplaint")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">{t("complaints.description")}</label>
                <Textarea placeholder={t("complaints.descPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted border-border min-h-[100px]" maxLength={500} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">{t("complaints.photo")}</label>
                <label className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{photo ? photo.name : t("complaints.uploadPhoto")}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : t("complaints.detectingLocation")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 eco-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Camera className="h-5 w-5 mr-2" />{t("complaints.submitComplaint")}</>}
              </Button>
            </form>
          </motion.div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">{t("complaints.recentComplaints")}</h2>
            {complaints.map((c, idx) => {
              const StatusIcon = statusIcons[c.status];
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-2xl bg-card border border-border p-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">📸</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[c.status]}`}>
                    <StatusIcon className="h-3 w-3" />{c.status.replace("_", " ")}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
