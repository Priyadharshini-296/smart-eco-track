import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import compostHome from "@/assets/compost-home.jpg";
import compostPit from "@/assets/compost-pit.jpg";
import compostVermi from "@/assets/compost-vermi.jpg";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CompostGuide() {
  const { t } = useLanguage();

  const methods = [
    {
      titleKey: "compost.homeTitle", emoji: "🏠", image: compostHome,
      descKey: "compost.homeDesc", duration: "2-3 months",
      stepKeys: ["compost.homeStep1", "compost.homeStep2", "compost.homeStep3", "compost.homeStep4", "compost.homeStep5"],
      matKeys: ["compost.homeMat1", "compost.homeMat2", "compost.homeMat3", "compost.homeMat4"],
    },
    {
      titleKey: "compost.pitTitle", emoji: "🕳️", image: compostPit,
      descKey: "compost.pitDesc", duration: "4-6 months",
      stepKeys: ["compost.pitStep1", "compost.pitStep2", "compost.pitStep3", "compost.pitStep4", "compost.pitStep5"],
      matKeys: ["compost.pitMat1", "compost.pitMat2", "compost.pitMat3", "compost.pitMat4"],
    },
    {
      titleKey: "compost.vermiTitle", emoji: "🪱", image: compostVermi,
      descKey: "compost.vermiDesc", duration: "3-4 months",
      stepKeys: ["compost.vermiStep1", "compost.vermiStep2", "compost.vermiStep3", "compost.vermiStep4", "compost.vermiStep5"],
      matKeys: ["compost.vermiMat1", "compost.vermiMat2", "compost.vermiMat3", "compost.vermiMat4"],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("compost.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("compost.subtitle")}</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {methods.map((method) => (
            <motion.div key={method.titleKey} variants={item} className="rounded-2xl bg-card border border-border overflow-hidden hover:eco-shadow transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-80 shrink-0 relative overflow-hidden">
                  <img src={method.image} alt={t(method.titleKey)} className="w-full h-full object-cover min-h-[200px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
                    <span className="text-4xl mb-2">{method.emoji}</span>
                    <h2 className="font-display text-xl font-bold text-white">{t(method.titleKey)}</h2>
                    <p className="text-sm text-white/70 mt-1">{t(method.descKey)}</p>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs text-white font-medium w-fit">
                      ⏱ {method.duration}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-5">
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-3">{t("compost.stepByStep")}</h3>
                    <ol className="space-y-3">
                      {method.stepKeys.map((stepKey, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full eco-gradient text-xs font-bold text-primary-foreground">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground pt-0.5">{t(stepKey)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{t("compost.materialsNeeded")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {method.matKeys.map((matKey) => (
                        <span key={matKey} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {t(matKey)}
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
