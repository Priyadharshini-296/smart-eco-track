import { motion } from "framer-motion";
import { Recycle, Sprout, MapPin, Camera, Bell, TrendingUp, Trash2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/i18n/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { t } = useLanguage();

  const stats = [
    { label: t("dashboard.complaintsFiled"), value: "24", icon: Camera, color: "eco-gradient" },
    { label: t("dashboard.resolved"), value: "18", icon: CheckCircle, color: "eco-gradient-warm" },
    { label: t("dashboard.vehiclesActive"), value: "7", icon: MapPin, color: "eco-gradient" },
    { label: t("dashboard.wasteCollected"), value: "3.2T", icon: Trash2, color: "eco-gradient-warm" },
  ];

  const quickLinks = [
    { path: "/waste-guide", label: t("nav.wasteGuide"), desc: t("dashboard.wasteGuideDesc"), icon: Recycle, emoji: "♻️" },
    { path: "/compost-guide", label: t("nav.compostGuide"), desc: t("dashboard.compostGuideDesc"), icon: Sprout, emoji: "🌱" },
    { path: "/live-tracking", label: t("dashboard.trackVehicles"), desc: t("dashboard.trackVehiclesDesc"), icon: MapPin, emoji: "🗺️" },
    { path: "/complaints", label: t("dashboard.reportGarbage"), desc: t("dashboard.reportGarbageDesc"), icon: Camera, emoji: "📸" },
    { path: "/notifications", label: t("nav.notifications"), desc: t("dashboard.notificationsDesc"), icon: Bell, emoji: "🔔" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.welcome")}</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={item} className="rounded-2xl bg-card border border-border p-5 eco-shadow">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">{t("dashboard.quickAccess")}</h2>
          <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <motion.div key={link.path} variants={item}>
                <Link
                  to={link.path}
                  className="group flex items-start gap-4 rounded-2xl bg-card border border-border p-5 hover:eco-shadow transition-shadow duration-300"
                >
                  <span className="text-3xl">{link.emoji}</span>
                  <div>
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl eco-gradient p-6 text-primary-foreground"
        >
          <div className="flex items-start gap-4">
            <TrendingUp className="h-8 w-8 shrink-0 mt-1" />
            <div>
              <h3 className="font-display text-lg font-bold">{t("dashboard.ecoTipTitle")}</h3>
              <p className="mt-1 text-primary-foreground/80">{t("dashboard.ecoTipText")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
