import { motion } from "framer-motion";
import { Leaf, Recycle, Trash2, AlertTriangle, HeartPulse } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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

const categories = [
  {
    title: "Biodegradable Waste",
    icon: Leaf,
    emoji: "🍂",
    color: "bg-primary",
    image: wasteBio,
    description: "Organic waste that decomposes naturally through biological processes.",
    examples: ["Food scraps & leftovers", "Fruit & vegetable peels", "Garden waste & leaves", "Paper & cardboard", "Coffee grounds & tea bags", "Eggshells"],
    tip: "Collect in a green bin. Great for composting!",
    binColor: "Green",
  },
  {
    title: "Recyclable Waste",
    icon: Recycle,
    emoji: "♻️",
    color: "bg-accent",
    image: wasteRecycle,
    description: "Materials that can be processed and reused to create new products.",
    examples: ["Plastic bottles & containers", "Glass jars & bottles", "Metal cans & aluminum", "Newspapers & magazines", "Cardboard boxes", "Clean packaging"],
    tip: "Rinse containers before recycling. Remove labels when possible.",
    binColor: "Blue",
  },
  {
    title: "Non-Recyclable Waste",
    icon: Trash2,
    emoji: "🚫",
    color: "bg-muted-foreground",
    image: wasteNon,
    description: "Items that cannot be recycled and must go to landfills.",
    examples: ["Styrofoam & polystyrene", "Chip bags & candy wrappers", "Ceramics & pottery", "Diapers & sanitary products", "Broken mirrors", "Contaminated food packaging"],
    tip: "Minimize non-recyclable waste by choosing reusable alternatives.",
    binColor: "Black",
  },
  {
    title: "Medical / Hazardous Waste",
    icon: HeartPulse,
    emoji: "⚠️",
    color: "bg-destructive",
    image: wasteHaz,
    description: "Dangerous materials requiring special handling and disposal.",
    examples: ["Used syringes & needles", "Expired medications", "Batteries & electronics", "Paint & chemicals", "Fluorescent bulbs", "Motor oil & antifreeze"],
    tip: "Never mix with regular waste. Use designated drop-off points.",
    binColor: "Red",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function WasteGuide() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Waste Segregation Guide</h1>
          <p className="text-muted-foreground mt-1">Learn how to sort your waste for a cleaner environment.</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <motion.div
              key={cat.title}
              variants={item}
              className="group rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow duration-300"
            >
              {/* AI-Generated Image */}
              <div className="relative h-48 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{cat.emoji}</span>
                    <h2 className="font-display text-lg font-bold text-white">{cat.title}</h2>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${binColorMap[cat.binColor]}`}>
                    🗑️ {cat.binColor} Bin
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">{cat.description}</p>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Common Examples</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.examples.map((ex) => (
                      <div key={ex} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-muted p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{cat.tip}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
