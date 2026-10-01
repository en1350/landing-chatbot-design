import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export const PLAN_FEATURES = [
  "Безлимитные генерации уроков, игр, интенсивов и заданий",
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

const PlanCards = ({ onSelect, compact = false }: PlanCardsProps) => {
  const { isPaid } = useAuth();

  return (
    <div className={compact ? "space-y-3" : "grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto"}>
      <div className={`rounded-2xl border border-border bg-card flex flex-col ${compact ? "p-4" : "p-7"}`}>
        <p className="font-display text-base font-bold">Месяц</p>
        <div className="flex items-baseline gap-1 mt-2 mb-4">
          <span className={`font-display font-bold ${compact ? "text-3xl" : "text-4xl"}`}>129 ₽</span>
          <span className="text-muted-foreground text-sm">/ месяц</span>
        </div>
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
        <Button variant="outline" className="h-11 gap-2" onClick={onSelect} disabled={isPaid}>
          <Icon name="Sparkles" size={16} />
          {isPaid ? "Уже подключено" : "Выбрать"}
        </Button>
      </div>

      <div
        className={`relative rounded-2xl border-2 border-coral bg-card flex flex-col shadow-xl shadow-coral/10 ${
          compact ? "p-4 mt-5" : "p-7"
        }`}
      >
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-coral-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          Выгоднее на 23%
        </span>
        <p className="font-display text-base font-bold">Год</p>
        <div className="flex items-baseline gap-1 mt-2 mb-1">
          <span className={`font-display font-bold ${compact ? "text-3xl" : "text-4xl"}`}>1199 ₽</span>
          <span className="text-muted-foreground text-sm">/ год</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">≈ 100 ₽ в месяц</p>
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
        <Button className="h-11 gap-2 bg-coral text-coral-foreground hover:bg-coral/90" onClick={onSelect} disabled={isPaid}>
          <Icon name="Sparkles" size={16} />
          {isPaid ? "Уже подключено" : "Выбрать"}
        </Button>
      </div>
    </div>
  );
};

export default PlanCards;
