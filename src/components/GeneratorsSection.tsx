import { useState } from "react";
import { Link } from "react-router-dom";
import GeneratorCard from "@/components/GeneratorCard";
import GeneratorModal from "@/components/GeneratorModal";
import UpgradeModal from "@/components/UpgradeModal";
import { GeneratorType } from "@/context/AuthContext";
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
  {
    type: "quiz",
    icon: "✅",
    title: "Генератор тестовых заданий",
    accent: "#16A34A",
  },
];

interface GeneratorsSectionProps {
  onNeedAuth: () => void;
}

const GeneratorsSection = ({ onNeedAuth }: GeneratorsSectionProps) => {
  const [activeType, setActiveType] = useState<GeneratorType | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <section id="generators" className="container pt-6 pb-16 md:pt-8 md:pb-24">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-coral">Инструменты</span>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2">
          Генераторы для педагога
        </h2>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Выберите нужный инструмент — заполните тему и класс, получите готовый результат за секунды.
        </p>
      </div>

      <div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          <div className="animate-fade-in h-full" style={{ animationDelay: "0ms" }}>
            <Link
              to="/konstruktor-rabochih-programm"
              className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
              style={{ backgroundColor: "#1E3A8A" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
                📖
              </div>
              <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">
                Конструктор рабочих программ
              </h3>
              <Icon
                name="ArrowRight"
                size={18}
                className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
          {GENERATORS.map((g, i) => (
            <div key={g.type} className="animate-fade-in h-full" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
              <GeneratorCard {...g} onOpen={() => setActiveType(g.type)} />
            </div>
          ))}
          <div className="animate-fade-in h-full" style={{ animationDelay: `${GENERATORS.length * 80}ms` }}>
            <Link
              to="/generator-prezentaciy"
              className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
              style={{ backgroundColor: "#0D9488" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
                📊
              </div>
              <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">
                Генератор презентаций
              </h3>
              <Icon
                name="ArrowRight"
                size={18}
                className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
          <div className="animate-fade-in h-full" style={{ animationDelay: `${(GENERATORS.length + 1) * 80}ms` }}>
            <Link
              to="/generator-zadaniy-pm"
              className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
              style={{ backgroundColor: "#C2410C" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
                🛠️
              </div>
              <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">
                Генератор заданий по профессиональному модулю
              </h3>
              <Icon
                name="ArrowRight"
                size={18}
                className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
          <div className="animate-fade-in h-full" style={{ animationDelay: `${(GENERATORS.length + 2) * 80}ms` }}>
            <Link
              to="/generator-proektov"
              className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
              style={{ backgroundColor: "#4F46E5" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
                🗂️
              </div>
              <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">
                Генератор проектов
              </h3>
              <Icon
                name="ArrowRight"
                size={18}
                className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
          <div className="animate-fade-in h-full" style={{ animationDelay: `${(GENERATORS.length + 3) * 80}ms` }}>
            <Link
              to="/konstruktor-rabochih-listov"
              className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
              style={{ backgroundColor: "#0E7490" }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
                📄
              </div>
              <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">
                Конструктор рабочих листов
              </h3>
              <Icon
                name="ArrowRight"
                size={18}
                className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
        </div>

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