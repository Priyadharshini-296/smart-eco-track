import { motion } from "framer-motion";
import { Recycle, Sprout, MapPin, Camera, Bell, TrendingUp, Trash2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";

const stats = [
  { label: "Complaints Filed", value: "24", icon: Camera, color: "eco-gradient" },
  { label: "Resolved", value: "18", icon: CheckCircle, color: "eco-gradient-warm" },
  { label: "Vehicles Active", value: "7", icon: MapPin, color: "eco-gradient" },
  { label: "Waste Collected", value: "3.2T", icon: Trash2, color: "eco-gradient-warm" },
];

const quickLinks = [
  { path: "/waste-guide", label: "Waste Segregation Guide", desc: "Learn proper waste sorting", icon: Recycle, emoji: "♻️" },
  { path: "/compost-guide", label: "Compost Guide", desc: "Start composting at home", icon: Sprout, emoji: "🌱" },
  { path: "/live-tracking", label: "Track Vehicles", desc: "Real-time garbage truck tracking", icon: MapPin, emoji: "🗺️" },
  { path: "/complaints", label: "Report Garbage", desc: "Upload and geo-tag complaints", icon: Camera, emoji: "📸" },
  { path: "/notifications", label: "Notifications", desc: "Stay updated on collections", icon: Bell, emoji: "🔔" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your eco overview.</p>
        </div>

        {/* Stats */}
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

        {/* Quick Links */}
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Quick Access</h2>
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

        {/* Eco Tip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl eco-gradient p-6 text-primary-foreground"
        >
          <div className="flex items-start gap-4">
            <TrendingUp className="h-8 w-8 shrink-0 mt-1" />
            <div>
              <h3 className="font-display text-lg font-bold">Eco Tip of the Day</h3>
              <p className="mt-1 text-primary-foreground/80">
                Composting food scraps can reduce household waste by up to 30%. Start your compost journey today with our step-by-step guide!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
