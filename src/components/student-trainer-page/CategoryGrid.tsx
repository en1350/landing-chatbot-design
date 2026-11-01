import Icon from "@/components/ui/icon";
import { CategoryKey, CATEGORIES, TRAINERS } from "./trainerData";

interface CategoryGridProps {
  setCategory: (c: CategoryKey | null) => void;
}

const CategoryGrid = ({ setCategory }: CategoryGridProps) => {
  return (
    <>
      <div className="max-w-2xl mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-coral">Для учеников</span>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
          <span className="text-3xl">🧠</span> Тренажёры для учеников
        </h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Выберите раздел — внутри тесты, игры, симуляторы и практические работы прямо в
          браузере.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {CATEGORIES.map((c, i) => {
          const count = TRAINERS.filter((t) => t.category === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="group relative text-left rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${c.accent}1A` }}
              >
                {c.icon}
              </div>
              <h3 className="font-display font-bold text-lg mb-1.5">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {c.description}
              </p>
              <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                style={{ color: c.accent }}
              >
                {count} {count === 1 ? "тренажёр" : count < 5 ? "тренажёра" : "тренажёров"}
                <Icon name="ArrowRight" size={15} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CategoryGrid;
