import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Trash2, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassificationResult {
  bin_color: string;
  waste_type: string;
  explanation: string;
  tips: string[];
}

export default function WasteClassifier() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleClassify = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("classify-waste", {
        body: { image: imagePreview },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Rate limit")) toast.error("Too many requests, please try again in a moment.");
        else if (data.error.includes("Payment")) toast.error("AI credits exhausted. Please add credits in Settings.");
        else toast.error(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      toast.error("Classification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImagePreview(null); setResult(null); };

  const binColorMap: Record<string, { bg: string; text: string; emoji: string }> = {
    Green: { bg: "bg-primary", text: "text-primary-foreground", emoji: "🟢" },
    Blue: { bg: "bg-accent", text: "text-accent-foreground", emoji: "🔵" },
    Black: { bg: "bg-foreground", text: "text-background", emoji: "⚫" },
    Red: { bg: "bg-destructive", text: "text-destructive-foreground", emoji: "🔴" },
    Yellow: { bg: "bg-secondary", text: "text-secondary-foreground", emoji: "🟡" },
  };

  const binStyle = result ? (binColorMap[result.bin_color] || binColorMap.Black) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">AI Waste Classifier</h1>
          <p className="text-muted-foreground mt-1">Upload or capture a photo of waste and AI will tell you which bin it belongs to.</p>
        </div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!imagePreview ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-display font-semibold text-foreground">Click to upload a photo</p>
                  <p className="text-sm text-muted-foreground">or drag and drop • JPG, PNG up to 5MB</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => cameraInputRef.current?.click()} className="gap-2">
                  <Camera className="h-4 w-4" /> Take Photo
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Waste to classify" className="w-full max-h-80 object-contain bg-muted" />
                <button onClick={reset} className="absolute top-3 right-3 bg-foreground/70 text-background rounded-full p-2 hover:bg-foreground transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {!result && (
                <Button onClick={handleClassify} disabled={loading} className="w-full h-12 eco-gradient text-primary-foreground font-semibold text-base gap-2">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Trash2 className="h-5 w-5" /> Classify Waste</>}
                </Button>
              )}

              {/* Result */}
              <AnimatePresence>
                {result && binStyle && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className={`rounded-2xl ${binStyle.bg} p-6 ${binStyle.text}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{binStyle.emoji}</span>
                        <div>
                          <p className="text-sm font-medium opacity-80">This goes in the</p>
                          <h2 className="font-display text-3xl font-bold">{result.bin_color} Bin</h2>
                        </div>
                      </div>
                      <p className="text-lg font-semibold mt-2">{result.waste_type}</p>
                    </div>

                    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
                      <h3 className="font-display font-semibold text-foreground">Why?</h3>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                      {result.tips?.length > 0 && (
                        <div>
                          <h4 className="font-display font-semibold text-foreground text-sm mb-2">Tips</h4>
                          <ul className="space-y-1">
                            {result.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button onClick={reset} variant="outline" className="w-full gap-2">
                      <RotateCcw className="h-4 w-4" /> Classify Another
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
