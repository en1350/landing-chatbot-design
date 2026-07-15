import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useUsage } from "@/context/UsageContext";
import UpgradeModal from "@/components/UpgradeModal";

interface PricingSectionProps {
  id?: string;
}

const FEATURES = [
  "Безлимитные генерации уроков, игр, интенсивов и заданий",
  "Проверка тетрадей по фото без ограничений",
  "Доступ к тренажёрам и декомпозитору компетенций",
  "Приоритетная поддержка",
];

const PricingSection = ({ id }: PricingSectionProps) => {
  const { isPaid } = useUsage();
  const [open, setOpen] = useState(false);

  return (
    <section id={id} className="container py-16 md:py-24">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-coral">Тарифы</span>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Простая цена без сюрпризов</h2>
        <p className="text-muted-foreground mt-3">Начните бесплатно, переходите на полный доступ в любой момент.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-7 flex flex-col animate-fade-in">
          <p className="font-display text-lg font-bold">Месяц</p>
          <div className="flex items-baseline gap-1 mt-3 mb-5">
            <span className="font-display text-4xl font-bold">99 ₽</span>
            <span className="text-muted-foreground text-sm">/ месяц</span>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Icon name="Check" size={16} className="text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="h-11 gap-2" onClick={() => setOpen(true)} disabled={isPaid}>
            <Icon name="Sparkles" size={16} />
            {isPaid ? "Уже подключено" : "Выбрать"}
          </Button>
        </div>

        <div className="relative rounded-2xl border-2 border-coral bg-card p-7 flex flex-col shadow-xl shadow-coral/10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-coral-foreground text-xs font-bold px-3 py-1 rounded-full">
            Выгоднее на 25%
          </span>
          <p className="font-display text-lg font-bold">Год</p>
          <div className="flex items-baseline gap-1 mt-3 mb-1">
            <span className="font-display text-4xl font-bold">890 ₽</span>
            <span className="text-muted-foreground text-sm">/ год</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">≈ 74 ₽ в месяц</p>
          <ul className="space-y-2.5 mb-6 flex-1">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Icon name="Check" size={16} className="text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button className="h-11 gap-2 bg-coral text-coral-foreground hover:bg-coral/90" onClick={() => setOpen(true)} disabled={isPaid}>
            <Icon name="Sparkles" size={16} />
            {isPaid ? "Уже подключено" : "Выбрать"}
          </Button>
        </div>
      </div>

      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
};

export default PricingSection;
