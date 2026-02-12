import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Truck, MapPin, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "vehicle" | "alert" | "success" | "info";
  time: string;
  read: boolean;
}

const demoNotifications: Notification[] = [
  { id: "1", title: "Vehicle Approaching", message: "Garbage vehicle GV-01 is 5 minutes away from your area.", type: "vehicle", time: "2 min ago", read: false },
  { id: "2", title: "Complaint Resolved", message: "Your complaint #2847 about overflowing bin has been resolved.", type: "success", time: "1 hour ago", read: false },
  { id: "3", title: "Collection Schedule", message: "Reminder: Recyclable waste collection is scheduled for tomorrow at 8 AM.", type: "info", time: "3 hours ago", read: false },
  { id: "4", title: "Vehicle Nearby", message: "Garbage vehicle GV-02 is currently in your neighborhood.", type: "vehicle", time: "5 hours ago", read: true },
  { id: "5", title: "New Eco Tip", message: "Separate wet and dry waste to improve composting efficiency by 40%.", type: "alert", time: "1 day ago", read: true },
  { id: "6", title: "Complaint In Progress", message: "Your complaint #2839 is now being processed by the cleanup crew.", type: "info", time: "2 days ago", read: true },
];

const typeConfig = {
  vehicle: { icon: Truck, class: "eco-gradient" },
  alert: { icon: AlertTriangle, class: "eco-gradient-warm" },
  success: { icon: CheckCircle, class: "eco-gradient" },
  info: { icon: Bell, class: "bg-muted-foreground" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(demoNotifications);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "You're all caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold text-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">You'll be notified about vehicle arrivals and complaint updates.</p>
            </div>
          ) : (
            notifications.map((n, idx) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl bg-card border p-5 flex items-start gap-4 transition-colors ${
                    n.read ? "border-border" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.class}`}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse-eco" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{n.time}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
