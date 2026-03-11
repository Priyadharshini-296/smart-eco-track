import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, MapPin, AlertCircle, CheckCircle, Loader2, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

interface AdminComplaint {
  id: string; user: string; description: string; latitude: number; longitude: number;
  status: "pending" | "in_progress" | "completed"; created_at: string;
}

const demoComplaints: AdminComplaint[] = [
  { id: "C-001", user: "Priya S.", description: "Large garbage pile near bus stop on MG Road", latitude: 19.076, longitude: 72.877, status: "pending", created_at: "2026-02-12" },
  { id: "C-002", user: "Rahul M.", description: "Overflowing community bin on 5th cross", latitude: 19.082, longitude: 72.880, status: "in_progress", created_at: "2026-02-11" },
  { id: "C-003", user: "Anita K.", description: "Illegal dumping near park entrance", latitude: 19.088, longitude: 72.885, status: "pending", created_at: "2026-02-11" },
  { id: "C-004", user: "Vijay P.", description: "Medical waste found near residential area", latitude: 19.090, longitude: 72.886, status: "completed", created_at: "2026-02-10" },
  { id: "C-005", user: "Meera D.", description: "Construction debris blocking sidewalk", latitude: 19.094, longitude: 72.889, status: "in_progress", created_at: "2026-02-09" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-secondary/20 text-secondary-foreground",
  in_progress: "bg-accent/20 text-accent-foreground",
  completed: "bg-primary/20 text-primary",
};

export default function Admin() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState(demoComplaints);

  const updateStatus = (id: string, newStatus: string) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus as AdminComplaint["status"] } : c)));
    toast.success(`Complaint ${id} updated to ${newStatus.replace("_", " ")}`);
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    completed: complaints.filter((c) => c.status === "completed").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl eco-gradient"><Shield className="h-5 w-5 text-primary-foreground" /></div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{t("admin.title")}</h1>
              <p className="text-muted-foreground">{t("admin.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("admin.totalComplaints"), value: stats.total, icon: Eye, gradient: "eco-gradient" },
            { label: t("admin.pending"), value: stats.pending, icon: AlertCircle, gradient: "eco-gradient-warm" },
            { label: t("admin.inProgress"), value: stats.inProgress, icon: Loader2, gradient: "eco-gradient" },
            { label: t("admin.completed"), value: stats.completed, icon: CheckCircle, gradient: "eco-gradient" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border p-5">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.gradient} mb-2`}><s.icon className="h-4 w-4 text-primary-foreground" /></div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border"><h2 className="font-display font-semibold text-foreground">{t("admin.allComplaints")}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.id")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.user")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.description")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.location")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.status")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{c.id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{c.user}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{c.description}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.latitude.toFixed(3)}, {c.longitude.toFixed(3)}</span></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[c.status]}`}>{c.status.replace("_", " ")}</span></td>
                    <td className="px-6 py-4">
                      <Select value={c.status} onValueChange={(val) => updateStatus(c.id, val)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                          <SelectItem value="in_progress">{t("admin.inProgress")}</SelectItem>
                          <SelectItem value="completed">{t("admin.completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
