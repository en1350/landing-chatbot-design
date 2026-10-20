import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export const PLAN_FEATURES = [
  "Безлимитные генерации уроков, игр, интенсивов и заданий",
  "Генератор презентаций с ИИ-иллюстрациями, скачивание в PPTX и PDF",
  "Проверка тетрадей по фото без ограничений",
  "Безлимитная проверка работ на антиплагиат",
  "Доступ к тренажёрам и декомпозитору компетенций",
  "Аналитическая справка качества обученности",
  "Приоритетная поддержка",
];

interface PlanCardsProps {
  onSelect: () => void;
  compact?: boolean;
}

interface PlanItem {
  name: string;
  price: string;
  period: string;
  perMonth?: string;
  badge?: string;
  highlight?: boolean;
}

const PLANS: PlanItem[] = [
  { name: "Разово", price: "17 ₽", period: "/ 1 использование" },
  { name: "Месяц", price: "199 ₽", period: "/ месяц" },
  { name: "3 месяца", price: "477 ₽", period: "/ 3 месяца", perMonth: "≈ 159 ₽ в месяц", badge: "Выгоднее на 20%" },
  { name: "12 месяцев", price: "1668 ₽", period: "/ год", perMonth: "≈ 139 ₽ в месяц", badge: "Выгоднее на 30%", highlight: true },
];

const PlanCards = ({ onSelect, compact = false }: PlanCardsProps) => {
  const { isPaid } = useAuth();

  return (
    <div className={compact ? "space-y-3" : "grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto"}>
      {PLANS.map((p) => (
        <div
          key={p.name}
          className={`relative rounded-2xl bg-card flex flex-col ${compact ? "p-4" : "p-7"} ${
            p.highlight ? "border-2 border-coral shadow-xl shadow-coral/10" : "border border-border"
          } ${compact && p.badge ? "mt-5" : ""}`}
        >
          {p.badge && (
            <span
              className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                p.highlight ? "bg-coral text-coral-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              {p.badge}
            </span>
          )}
          <p className="font-display text-base font-bold">{p.name}</p>
          <div className={`flex items-baseline gap-1 mt-2 ${p.perMonth ? "mb-1" : "mb-4"}`}>
            <span className={`font-display font-bold ${compact ? "text-3xl" : "text-4xl"}`}>{p.price}</span>
            <span className="text-muted-foreground text-sm">{p.period}</span>
          </div>
          {p.perMonth && <p className="text-xs text-muted-foreground mb-4">{p.perMonth}</p>}
          {!compact && (
            <ul className="space-y-2.5 mb-6 flex-1">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Icon name="Check" size={16} className="text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <Button
            variant={p.highlight ? "default" : "outline"}
            className={`h-11 gap-2 ${p.highlight ? "bg-coral text-coral-foreground hover:bg-coral/90" : ""}`}
            onClick={onSelect}
            disabled={isPaid}
          >
            <Icon name="Sparkles" size={16} />
            {isPaid ? "Уже подключено" : p.name === "Разово" ? "Оплатить 17 ₽" : "Выбрать"}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PlanCards;
