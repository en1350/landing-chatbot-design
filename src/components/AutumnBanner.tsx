import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import bannerImg from "@/assets/autumn-banner.jpg";

interface AutumnBannerProps {
  onScrollToGenerators: () => void;
}

const AutumnBanner = ({ onScrollToGenerators }: AutumnBannerProps) => {
  return (
    <section className="container py-6 md:py-8">
      <div className="relative overflow-hidden rounded-2xl shadow-lg animate-fade-in">
        <img
          src={bannerImg}
          alt="Осенний учебный сезон"
          className="h-48 w-full object-cover sm:h-56 md:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 sm:px-10 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm mb-3">
              <Icon name="Leaf" size={13} />
              Новый учебный сезон
            </span>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight text-balance">
              Готовьтесь к урокам быстрее этой осенью
            </h2>
            <p className="mt-2 text-sm text-white/85 hidden sm:block">
              Планы уроков, задания и проверка тетрадей — с помощью ИИ за минуты
            </p>
            <Button
              size="sm"
              onClick={onScrollToGenerators}
              className="mt-4 gap-1.5 bg-white text-primary hover:bg-white/90"
            >
              <Icon name="Wand2" size={15} />
              Попробовать
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AutumnBanner;
