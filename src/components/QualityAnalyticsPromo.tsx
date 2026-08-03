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

const QualityAnalyticsPromo = ({ id }: QualityAnalyticsPromoProps) => {
  const { isPaid } = useAuth();

  return (
    <section id={id} className="container py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="animate-fade-in">
          <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">
            Аналитическая справка качества обученности
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-md">
            Уровневая аналитика качества освоения предметных умений: внесите оценки по группе — получите
            сводную статистику, индивидуальный разбор по каждому студенту и готовый план коррекционной
            работы, составленный ИИ.
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

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Link
            to="/analitika-kachestva"
            className="group relative flex flex-col items-center text-center rounded-2xl p-8 sm:p-10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white bg-gradient-to-br from-[#1e3c72] to-[#2a5298]"
          >
            {!isPaid && (
              <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm backdrop-blur-sm">
                🔒
              </span>
            )}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15 text-4xl mb-4 transition-transform group-hover:scale-110">
              📊
            </div>
            <h3 className="font-display text-lg font-bold leading-snug mb-1.5">
              Аналитическая справка качества обученности
            </h3>
            <p className="text-sm text-white/80 mb-4">
              {isPaid ? "Доступно по вашему тарифу" : "Премиум-инструмент по подписке"}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1">
              Открыть инструмент
              <Icon name="ArrowRight" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default QualityAnalyticsPromo;
