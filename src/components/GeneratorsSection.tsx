import { useState } from "react";
import GeneratorCard from "@/components/GeneratorCard";
import GeneratorModal from "@/components/GeneratorModal";
import UpgradeModal from "@/components/UpgradeModal";
import { GeneratorType, useUsage } from "@/context/UsageContext";
import Icon from "@/components/ui/icon";

const GENERATORS: { type: GeneratorType; icon: string; title: string; accent: string }[] = [
  {
    type: "lesson",
    icon: "📘",
    title: "Генератор уроков",
    accent: "#2563EB",
  },
  {
    type: "game",
    icon: "🎲",
    title: "Генератор игры",
    accent: "#E8483C",
  },
  {
    type: "intensive",
    icon: "🚀",
    title: "Генератор интенсивов и мастер-классов",
    accent: "#7C3AED",
  },
  {
    type: "task",
    icon: "📝",
    title: "Генератор заданий",
    accent: "#EA8C1F",
  },
];

interface GeneratorsSectionProps {
  onNeedAuth: () => void;
}

const GeneratorsSection = ({ onNeedAuth }: GeneratorsSectionProps) => {
  const { servicesCount } = useUsage();
  const [activeType, setActiveType] = useState<GeneratorType | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <section id="generators" className="container py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-coral">Инструменты</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
          Четыре генератора для педагога
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Выберите нужный инструмент — заполните тему и класс, получите готовый результат за секунды.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-10 text-sm text-muted-foreground">
        <Icon name="TrendingUp" size={15} className="text-primary" />
        Уже оказано услуг:{" "}
        <span className="font-display font-bold text-foreground tabular-nums">
          {servicesCount.toLocaleString("ru-RU")}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {GENERATORS.map((g, i) => (
          <div key={g.type} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <GeneratorCard {...g} onOpen={() => setActiveType(g.type)} />
          </div>
        ))}
      </div>

      <GeneratorModal
        open={!!activeType}
        type={activeType}
        onClose={() => setActiveType(null)}
        onNeedUpgrade={() => {
          setActiveType(null);
          setUpgradeOpen(true);
        }}
        onNeedAuth={onNeedAuth}
      />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={onNeedAuth} />
    </section>
  );
};

export default GeneratorsSection;