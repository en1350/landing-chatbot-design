import Icon from "@/components/ui/icon";
import { useAuth, GeneratorType } from "@/context/AuthContext";

interface GeneratorCardProps {
  type: GeneratorType;
  icon: string;
  title: string;
  accent: string;
  onOpen: () => void;
}

const GeneratorCard = ({ type, icon, title, accent, onOpen }: GeneratorCardProps) => {
  const { remainingUse, isPaid, user } = useAuth();
  const left = remainingUse(type);

  return (
    <button
      onClick={onOpen}
      className="group relative flex h-full w-full flex-col items-center text-center rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white"
      style={{ backgroundColor: accent }}
    >
      <span className="absolute top-3 right-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold backdrop-blur-sm">
        {isPaid ? <Icon name="Infinity" size={13} /> : user ? left : 3}
      </span>

      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl mb-3 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display text-base font-bold leading-snug flex-1 flex items-center">{title}</h3>

      <Icon
        name="ArrowRight"
        size={18}
        className="mt-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
      />
    </button>
  );
};

export default GeneratorCard;