import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface PopularSectionsProps {
  onScrollTo: (id: string) => void;
}

interface Item {
  icon: string;
  title: string;
  text: string;
  to?: string;
  anchor?: string;
  badge?: string;
}

const ITEMS: Item[] = [
  { icon: "BookOpen", title: "Конструктор урока", text: "Карточка урока с этапами за минуты", to: "/konstruktor-uroka" },
  { icon: "ClipboardList", title: "Конструктор заданий", text: "Задания и критерии оценивания", to: "/konstruktor-zadaniy" },
  { icon: "FileText", title: "Рабочие листы", text: "Листы с заданиями, PDF для печати", to: "/konstruktor-rabochih-listov" },
  { icon: "Presentation", title: "Презентации", text: "Слайды по теме урока", to: "/generator-prezentaciy" },
  { icon: "Brain", title: "Тренажёры для учеников", text: "Интерактивные уроки и тесты", to: "/trenazher-dlya-uchenikov", badge: "Бесплатно" },
  { icon: "ScanText", title: "Проверка тетради", text: "ИИ проверит работу по фото", anchor: "notebook" },
  { icon: "BarChart3", title: "Аналитика качества", text: "Справки и планы коррекции", anchor: "quality-analytics" },
];

const cardClass =
  "group relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md";

const Body = ({ item }: { item: Item }) => (
  <>
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
      <Icon name={item.icon} size={22} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="font-display text-sm font-bold leading-snug">{item.title}</span>
        {item.badge && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {item.badge}
          </span>
        )}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{item.text}</span>
    </span>
    <Icon
      name="ArrowRight"
      size={16}
      className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
    />
  </>
);

const PopularSections = ({ onScrollTo }: PopularSectionsProps) => {
  return (
    <section className="container relative z-10 pt-2 pb-6 md:pb-10" aria-label="Популярные разделы">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-lg sm:text-xl font-bold">Популярные разделы</h2>
        <button
          type="button"
          onClick={() => onScrollTo("generators")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Все инструменты
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) =>
          item.to ? (
            <Link key={item.title} to={item.to} className={cardClass}>
              <Body item={item} />
            </Link>
          ) : (
            <button
              key={item.title}
              type="button"
              onClick={() => onScrollTo(item.anchor || "generators")}
              className={cardClass}
            >
              <Body item={item} />
            </button>
          ),
        )}
      </div>
    </section>
  );
};

export default PopularSections;
