import Icon from "@/components/ui/icon";
import { useUsage, GeneratorType } from "@/context/UsageContext";

interface GeneratorCardProps {
  type: GeneratorType;
  icon: string;
  title: string;
  desc: string;
  accent: string;
  onOpen: () => void;
}

const GeneratorCard = ({ type, icon, title, desc, accent, onOpen }: GeneratorCardProps) => {
  const { remaining, isPaid } = useUsage();
  const left = remaining(type);

  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col items-start text-left rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80 group-hover:h-1.5 transition-all"
        style={{ backgroundColor: accent }}
      />
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accent}1a` }}
      >
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>

      <div className="mt-auto flex items-center justify-between w-full pt-3 border-t border-border/60">
        <span className="text-xs font-semibold text-muted-foreground">
          {isPaid ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Icon name="Infinity" size={13} /> Безлимит
            </span>
          ) : (
            `Осталось: ${left} из 3`
          )}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
          Создать <Icon name="ArrowRight" size={15} />
        </span>
      </div>
    </button>
  );
};

export default GeneratorCard;
