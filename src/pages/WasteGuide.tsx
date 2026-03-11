import { motion } from "framer-motion";
import { Leaf, Recycle, Trash2, AlertTriangle, HeartPulse } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import wasteBio from "@/assets/waste-biodegradable.jpg";
import wasteRecycle from "@/assets/waste-recyclable.jpg";
import wasteNon from "@/assets/waste-nonrecyclable.jpg";
import wasteHaz from "@/assets/waste-hazardous.jpg";

const binColorMap: Record<string, string> = {
  Green: "bg-green-600 text-white",
  Blue: "bg-blue-600 text-white",
  Black: "bg-gray-900 text-white",
  Red: "bg-red-600 text-white",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function WasteGuide() {
  const { t } = useLanguage();

  const categories = [
    {
      titleKey: "waste.biodegradable", icon: Leaf, emoji: "🍂", color: "bg-primary", image: wasteBio,
      descKey: "waste.biodegradableDesc",
      exampleKeys: ["waste.foodScraps", "waste.fruitPeels", "waste.gardenWaste", "waste.paperCardboard", "waste.coffeeGrounds", "waste.eggshells"],
      tipKey: "waste.greenTip", binColor: "Green",
    },
    {
      titleKey: "waste.recyclable", icon: Recycle, emoji: "♻️", color: "bg-accent", image: wasteRecycle,
      descKey: "waste.recyclableDesc",
      exampleKeys: ["waste.plasticBottles", "waste.glassJars", "waste.metalCans", "waste.newspapers", "waste.cardboardBoxes", "waste.cleanPackaging"],
      tipKey: "waste.blueTip", binColor: "Blue",
    },
    {
      titleKey: "waste.nonRecyclable", icon: Trash2, emoji: "🚫", color: "bg-muted-foreground", image: wasteNon,
      descKey: "waste.nonRecyclableDesc",
      exampleKeys: ["waste.styrofoam", "waste.chipBags", "waste.ceramics", "waste.diapers", "waste.brokenMirrors", "waste.contaminatedPackaging"],
      tipKey: "waste.blackTip", binColor: "Black",
    },
    {
      titleKey: "waste.hazardous", icon: HeartPulse, emoji: "⚠️", color: "bg-destructive", image: wasteHaz,
      descKey: "waste.hazardousDesc",
      exampleKeys: ["waste.syringes", "waste.medications", "waste.batteries", "waste.paintChemicals", "waste.fluorescentBulbs", "waste.motorOil"],
      tipKey: "waste.redTip", binColor: "Red",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("waste.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("waste.subtitle")}</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <motion.div key={cat.titleKey} variants={item} className="group rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow duration-300">
              <div className="relative h-48 overflow-hidden">
                <img src={cat.image} alt={t(cat.titleKey)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{cat.emoji}</span>
                    <h2 className="font-display text-lg font-bold text-white">{t(cat.titleKey)}</h2>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${binColorMap[cat.binColor]}`}>
                    🗑️ {cat.binColor} {t("waste.bin")}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">{t(cat.descKey)}</p>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{t("waste.commonExamples")}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.exampleKeys.map((exKey) => (
                      <div key={exKey} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {t(exKey)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-muted p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t(cat.tipKey)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
