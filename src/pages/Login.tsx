import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Login() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); }
      else {
        const { data: profile } = await supabase.from("profiles").select("language").eq("id", data.user.id).single();
        if (!profile?.language || profile.language === 'english') { navigate("/language"); }
        else { navigate("/dashboard"); }
      }
    } catch { toast.error("Network error. Please check your connection and try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } } });
      if (error) { toast.error(error.message); }
      else { toast.success("Account created successfully!"); navigate("/language"); }
    } catch { toast.error("Network error. Please check your connection and try again."); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/dashboard` });
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Password reset link sent to your email!"); setMode("login"); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 eco-gradient-dark relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <Leaf key={i} className="absolute text-primary-foreground" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, transform: `rotate(${Math.random() * 360}deg)`, width: `${20 + Math.random() * 30}px`, height: `${20 + Math.random() * 30}px`, opacity: 0.3 + Math.random() * 0.5 }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center max-w-md">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl eco-gradient eco-shadow-lg"><Leaf className="h-10 w-10 text-primary-foreground" /></div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground mb-4">EcoGuard</h1>
          <p className="text-lg text-primary-foreground/70 leading-relaxed">{t("login.tagline")}</p>
          <div className="mt-10 flex justify-center gap-6">
            {[
              { label: t("login.realTimeTracking"), icon: "🗺️" },
              { label: t("login.smartSegregation"), icon: "♻️" },
              { label: t("login.ecoAlerts"), icon: "🔔" },
            ].map((f) => (
              <div key={f.label} className="text-center"><div className="text-3xl mb-2">{f.icon}</div><p className="text-xs text-primary-foreground/60">{f.label}</p></div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl eco-gradient"><Leaf className="h-5 w-5 text-primary-foreground" /></div>
            <h1 className="font-display text-2xl font-bold text-foreground">EcoGuard</h1>
          </div>

          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            {mode === "login" ? t("login.welcomeBack") : mode === "register" ? t("login.createAccount") : t("login.resetPassword")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? t("login.signInTo") : mode === "register" ? t("login.joinGreen") : t("login.sendResetLink")}
          </p>

          <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgotPassword} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input placeholder={t("login.fullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input type="email" placeholder={t("login.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-muted border-border" required />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder={t("login.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 bg-muted border-border" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}
            {mode === "login" && (
              <div className="text-right"><button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">{t("login.forgotPassword")}</button></div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-12 eco-gradient text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
              {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : (
                <>{mode === "login" ? t("login.signIn") : mode === "register" ? t("login.createAccountBtn") : t("login.sendResetLinkBtn")}<ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>{t("login.noAccount")}{" "}<button onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">{t("login.signUp")}</button></>
            ) : (
              <>{t("login.haveAccount")}{" "}<button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">{t("login.signInLink")}</button></>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
