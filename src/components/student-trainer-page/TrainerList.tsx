import Icon from "@/components/ui/icon";
import { CategoryKey, TrainerItem, CATEGORIES, TRAINERS, getSolvedCount } from "./trainerData";

interface TrainerListProps {
  category: CategoryKey | null;
  isPaid: boolean;
  setCategory: (c: CategoryKey | null) => void;
  handleSelect: (t: TrainerItem) => void;
}

const TrainerList = ({ category, isPaid, setCategory, handleSelect }: TrainerListProps) => {
  return (
    <>
      <button
        onClick={() => setCategory(null)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <Icon name="ArrowLeft" size={15} />
        Все разделы
      </button>

      <div className="max-w-2xl mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
          <span className="text-2xl">{CATEGORIES.find((c) => c.key === category)?.icon}</span>
          {CATEGORIES.find((c) => c.key === category)?.title}
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRAINERS.filter((t) => t.category === category).map((t, i) => {
          const locked = t.paid && !isPaid;
          return (
            <button
              key={t.key}
              onClick={() => handleSelect(t)}
              className="group relative text-left rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {locked && (
                <span className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="Lock" size={13} />
                </span>
              )}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${t.accent}1A` }}
              >
                {t.icon}
              </div>
              <h3 className="font-display font-bold text-base mb-1.5">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t.description}
              </p>
              {getSolvedCount(t.key) !== null && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 px-2.5 py-1 mb-3">
                  <Icon name="CheckCircle2" size={13} />
                  Выполнено заданий: {getSolvedCount(t.key)}
                </span>
              )}
              {locked ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <Icon name="Sparkles" size={15} />
                  Доступно по подписке
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                  style={{ color: t.accent }}
                >
                  Начать
                  <Icon name="ArrowRight" size={15} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default TrainerList;
