import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface DecomposerModalProps {
  open: boolean;
  onClose: () => void;
}

interface Level {
  level: string;
  desc: string;
}

function buildLevels(competency: string): Level[] {
  const c = competency || "выбранная компетенция";
  return [
    { level: "Знание", desc: `Ученик может назвать и описать основные понятия темы «${c}»` },
    { level: "Понимание", desc: `Объясняет своими словами суть и логику «${c}»` },
    { level: "Применение", desc: `Использует «${c}» для решения типовых задач` },
    { level: "Анализ", desc: `Сравнивает и разбирает компоненты «${c}» в нестандартных ситуациях` },
    { level: "Оценка", desc: `Аргументированно оценивает результат применения «${c}»` },
  ];
}

const DecomposerModal = ({ open, onClose }: DecomposerModalProps) => {
  const [competency, setCompetency] = useState("");
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCompetency("");
    setLevels(null);
    setLoading(false);
    onClose();
  };

  const decompose = () => {
    setLoading(true);
    setTimeout(() => {
      setLevels(buildLevels(competency));
      setLoading(false);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🧩</span> Декомпозитор компетенций
          </DialogTitle>
          <DialogDescription>
            Разложите любую компетенцию на уровни освоения по таксономии Блума
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <Input
            value={competency}
            onChange={(e) => setCompetency(e.target.value)}
            placeholder="Например: работа с историческими источниками"
          />
          <Button className="w-full h-11 gap-2 bg-primary hover:bg-primary/90" onClick={decompose} disabled={loading}>
            {loading ? (
              <>
                <Icon name="Loader2" size={17} className="animate-spin" />
                Разбираю...
              </>
            ) : (
              <>
                <Icon name="Layers" size={17} />
                Разложить на уровни
              </>
            )}
          </Button>

          {levels && (
            <div className="space-y-2.5 animate-fade-in max-h-72 overflow-y-auto pr-1">
              {levels.map((l, i) => (
                <div key={l.level} className="rounded-xl border border-border p-3.5 flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{l.level}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecomposerModal;
