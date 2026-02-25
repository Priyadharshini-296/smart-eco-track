import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import compostHome from "@/assets/compost-home.jpg";
import compostPit from "@/assets/compost-pit.jpg";
import compostVermi from "@/assets/compost-vermi.jpg";

const methods = [
  {
    title: "Home Composting",
    emoji: "🏠",
    image: compostHome,
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
    emoji: "🕳️",
    image: compostPit,
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
    emoji: "🪱",
    image: compostVermi,
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
          {methods.map((method) => (
            <motion.div
              key={method.title}
              variants={item}
              className="rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow duration-300"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image + Info */}
                <div className="lg:w-80 shrink-0 relative overflow-hidden">
                  <img src={method.image} alt={method.title} className="w-full h-full object-cover min-h-[200px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
                    <span className="text-4xl mb-2">{method.emoji}</span>
                    <h2 className="font-display text-xl font-bold text-white">{method.title}</h2>
                    <p className="text-sm text-white/70 mt-1">{method.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium w-fit">
                      ⏱ {method.duration}
                    </div>
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
