import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "english", label: "English", native: "English", flag: "🇬🇧" },
  { code: "tamil", label: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "telugu", label: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kannada", label: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "hindi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
];

export default function LanguagePreference() {
  const [selected, setSelected] = useState("english");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ language: selected } as any)
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save preference.");
    } else {
      toast.success("Language preference saved!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl eco-gradient eco-shadow-lg">
            <Globe className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Choose Language</h1>
          <p className="text-muted-foreground mt-2">Select your preferred language for the app</p>
        </div>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                selected === lang.code
                  ? "border-primary bg-primary/10 eco-shadow"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="text-left flex-1">
                <p className="font-display font-semibold text-foreground">{lang.label}</p>
                <p className="text-sm text-muted-foreground">{lang.native}</p>
              </div>
              {selected === lang.code && (
                <div className="h-5 w-5 rounded-full eco-gradient flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-12 eco-gradient text-primary-foreground font-semibold text-base"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              Continue <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
