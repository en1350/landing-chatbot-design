import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

interface QualityAnalyticsPromoProps {
  id?: string;
}

const FEATURES = [
  "Диагностика по 5-балльной шкале",
  "Аналитика по группе и по каждому студенту",
  "План коррекционной работы от ИИ",
];

const TOOLS = [
  {
    to: "/analitika-kachestva",
    icon: "📊",
    title: "Аналитическая справка качества обученности",
    gradient: "from-[#1e3c72] to-[#2a5298]",
  },
  {
    to: "/kachestvo-znaniy",
    icon: "📈",
    title: "Качественный анализ по предметам и дисциплинам",
    gradient: "from-[#7c2d12] to-[#c2410c]",
  },
];

const QualityAnalyticsPromo = ({ id }: QualityAnalyticsPromoProps) => {
  const { isPaid } = useAuth();

  return (
    <section id={id} className="container py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="animate-fade-in">
          <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">
            Аналитика качества обученности
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-md">
            Уровневая аналитика качества освоения предметных умений и автоматизированный расчёт
            качества знаний по группам и дисциплинам: сводные таблицы, динамика, план коррекционной
            работы от ИИ.
          </p>
          <ul className="mt-6 space-y-3">
            {FEATURES.map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm">
                <Icon name="CheckCircle2" size={17} className="text-primary shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group relative flex flex-col items-center text-center rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white bg-gradient-to-br ${tool.gradient} animate-fade-in`}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              {!isPaid && (
                <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm backdrop-blur-sm">
                  🔒
                </span>
              )}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-4 transition-transform group-hover:scale-110">
                {tool.icon}
              </div>
              <h3 className="font-display text-base font-bold leading-snug mb-1.5">{tool.title}</h3>
              <p className="text-xs text-white/80 mb-4">
                {isPaid ? "Доступно по вашему тарифу" : "Премиум-инструмент по подписке"}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1 mt-auto">
                Открыть
                <Icon name="ArrowRight" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QualityAnalyticsPromo;