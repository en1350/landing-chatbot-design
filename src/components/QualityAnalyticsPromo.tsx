import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface QualityAnalyticsPromoProps {
  id?: string;
}

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
  {
    to: "/vneauditornaya-deyatelnost",
    icon: "🎯",
    title: "Справка по внеаудиторной деятельности",
    gradient: "from-[#1e8449] to-[#27ae60]",
  },
  {
    to: "/matritsa-tehnologiy",
    icon: "🧩",
    title: "Матрица используемых технологий обучения",
    gradient: "from-[#5b21b6] to-[#7c3aed]",
  },
  {
    to: "/proektnaya-deyatelnost",
    icon: "🔬",
    title: "Справка по проектной и исследовательской деятельности",
    gradient: "from-[#0f766e] to-[#14b8a6]",
  },
  {
    to: "/korrektsionnaya-rabota",
    icon: "🗣️",
    title: "Справка по направлениям коррекционной работы",
    gradient: "from-[#be185d] to-[#ec4899]",
  },
];

const QualityAnalyticsPromo = ({ id }: QualityAnalyticsPromoProps) => {
  const { isPaid } = useAuth();

  return (
    <section id={id} className="container pb-10 sm:pb-16 md:pb-24">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-8 text-center animate-fade-in">
          Аналитические справки для портфолио
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className="text-xs text-white/80">
                {isPaid ? "Доступно по вашему тарифу" : "Премиум-инструмент по подписке"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QualityAnalyticsPromo;