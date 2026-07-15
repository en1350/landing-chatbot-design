import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface TrainerModalProps {
  open: boolean;
  onClose: () => void;
}

interface Question {
  q: string;
  options: string[];
  correct: number;
}

const QUESTIONS: Question[] = [
  {
    q: "Какой метод лучше подходит для проверки первичного усвоения материала?",
    options: ["Фронтальный опрос", "Итоговая контрольная", "Годовой проект"],
    correct: 0,
  },
  {
    q: "Что из перечисленного относится к формирующему оцениванию?",
    options: ["Годовой экзамен", "Обратная связь во время урока", "Диплом об окончании"],
    correct: 1,
  },
  {
    q: "Какая длительность оптимальна для этапа рефлексии на уроке 45 мин?",
    options: ["1–2 минуты", "5–7 минут", "20 минут"],
    correct: 1,
  },
];

const TrainerModal = ({ open, onClose }: TrainerModalProps) => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const reset = () => {
    setStep(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === QUESTIONS[step].correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (step + 1 < QUESTIONS.length) {
        setStep((s) => s + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 700);
  };

  const q = QUESTIONS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🎯</span> Тренажёр педагога
          </DialogTitle>
          <DialogDescription>Мини-квиз на педагогические ситуации</DialogDescription>
        </DialogHeader>

        {!finished ? (
          <div className="mt-2 space-y-4">
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <p className="font-medium leading-relaxed">{q.q}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correct;
                const showState = selected !== null;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                      showState && isCorrect
                        ? "border-primary bg-primary/10"
                        : showState && isSelected && !isCorrect
                        ? "border-destructive bg-destructive/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-center py-4 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl mb-4">
              🏆
            </div>
            <p className="font-display text-2xl font-bold">
              {score} из {QUESTIONS.length}
            </p>
            <p className="text-muted-foreground text-sm mt-1 mb-6">правильных ответов</p>
            <Button onClick={reset} className="gap-2">
              <Icon name="RotateCcw" size={16} />
              Пройти ещё раз
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrainerModal;
