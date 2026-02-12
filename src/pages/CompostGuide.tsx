import { motion } from "framer-motion";
import { Sprout, Home, Layers, Bug, ArrowRight, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const methods = [
  {
    title: "Home Composting",
    icon: Home,
    emoji: "🏠",
    description: "Simple backyard or kitchen composting for beginners.",
    steps: [
      "Choose a dry, shady spot near a water source",
      "Add brown materials (leaves, twigs) as a base layer",
      "Alternate green (food scraps) and brown (dry leaves) layers",
      "Keep moist like a wrung sponge, turn every 2 weeks",
      "Compost is ready in 2-3 months when dark and crumbly",
    ],
    materials: ["Kitchen scraps", "Dry leaves", "Newspaper", "Compost bin or pile"],
    duration: "2-3 months",
  },
  {
    title: "Pit Composting",
    icon: Layers,
    emoji: "🕳️",
    description: "Underground composting method, great for large gardens.",
    steps: [
      "Dig a pit 2-3 feet deep in your garden",
      "Add a layer of dry materials at the bottom",
      "Deposit kitchen waste and garden trimmings",
      "Cover each deposit with soil or dry leaves",
      "Fill completely, then cover and let decompose for 6 months",
    ],
    materials: ["Garden space", "Shovel", "Organic waste", "Soil cover"],
    duration: "4-6 months",
  },
  {
    title: "Vermicomposting",
    icon: Bug,
    emoji: "🪱",
    description: "Using worms to turn waste into nutrient-rich compost.",
    steps: [
      "Get a worm bin with drainage holes",
      "Add bedding: shredded newspaper moistened with water",
      "Introduce red wiggler worms (500-1000 for a small bin)",
      "Feed small amounts of food scraps, avoid citrus & onions",
      "Harvest castings every 3-4 months from the bottom",
    ],
    materials: ["Worm bin", "Red wiggler worms", "Shredded newspaper", "Food scraps"],
    duration: "3-4 months",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CompostGuide() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Composting Guide</h1>
          <p className="text-muted-foreground mt-1">Turn your waste into garden gold with these methods.</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {methods.map((method, idx) => (
            <motion.div
              key={method.title}
              variants={item}
              className="rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Left header */}
                <div className="eco-gradient p-6 lg:w-72 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-5xl mb-3">{method.emoji}</span>
                  <h2 className="font-display text-xl font-bold text-primary-foreground">{method.title}</h2>
                  <p className="text-sm text-primary-foreground/70 mt-1">{method.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground font-medium">
                    ⏱ {method.duration}
                  </div>
                </div>

                {/* Steps */}
                <div className="flex-1 p-6 space-y-5">
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3">Step-by-Step Process</h3>
                    <ol className="space-y-3">
                      {method.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full eco-gradient text-xs font-bold text-primary-foreground">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-2">Materials Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {method.materials.map((mat) => (
                        <span key={mat} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
