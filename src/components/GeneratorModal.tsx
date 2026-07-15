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
import { useUsage, GeneratorType } from "@/context/UsageContext";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { downloadTxt } from "@/lib/download";

interface GeneratorModalProps {
  open: boolean;
  onClose: () => void;
  type: GeneratorType | null;
  onNeedUpgrade: () => void;
  onNeedAuth: () => void;
}

const META: Record<GeneratorType, { title: string; icon: string; subject: string; resultLabel: string }> = {
  lesson: { title: "Генератор уроков", icon: "📘", subject: "Тема урока", resultLabel: "план урока" },
  game: { title: "Генератор игры", icon: "🎲", subject: "Тема игры", resultLabel: "сценарий игры" },
  intensive: { title: "Генератор интенсивов и мастер-классов", icon: "🚀", subject: "Тема интенсива", resultLabel: "программа интенсива" },
  task: { title: "Генератор заданий", icon: "📝", subject: "Тема задания", resultLabel: "комплект заданий" },
};

function buildMockResult(type: GeneratorType, topic: string, grade: string): string[] {
  const t = topic || "новая тема";
  const g = grade || "7";
  switch (type) {
    case "lesson":
      return [
        `Тема: «${t}», ${g} класс`,
        "Цель: сформировать базовое понимание темы и умение применять его на практике",
        "1. Оргмомент — 2 мин",
        "2. Актуализация знаний — 5 мин: фронтальный опрос",
        `3. Новый материал — 15 мин: объяснение «${t}» с примерами`,
        "4. Закрепление — 15 мин: практическая работа в парах",
        "5. Рефлексия и домашнее задание — 8 мин",
      ];
    case "game":
      return [
        `Игра по теме «${t}» для ${g} класса`,
        "Формат: командная викторина, 4 команды по 5–6 человек",
        "Раунд 1 — Разминка: быстрые вопросы на знание темы",
        "Раунд 2 — Кейсы: разбор практических ситуаций",
        "Раунд 3 — Финал: блиц на скорость реакции",
        "Награждение и разбор ошибок — 5 мин",
      ];
    case "intensive":
      return [
        `Интенсив «${t}» — 3 дня, ${g} класс`,
        "День 1: погружение в тему, диагностика знаний",
        "День 2: практикум в мини-группах, разбор кейсов",
        "День 3: проектная защита и обратная связь",
        "Материалы: рабочая тетрадь, чек-листы, итоговый тест",
      ];
    case "task":
      return [
        `Комплект заданий по теме «${t}», ${g} класс`,
        "Задание 1 (базовый уровень): найти и объяснить понятие",
        "Задание 2 (средний уровень): применить знания на примере",
        "Задание 3 (продвинутый уровень): проанализировать и аргументировать",
        "Критерии оценивания приложены к каждому заданию",
      ];
  }
}

const GeneratorModal = ({ open, onClose, type, onNeedUpgrade, onNeedAuth }: GeneratorModalProps) => {
  const { canUse, registerUse, remaining, isPaid } = useUsage();
  const { token, user } = useAuth();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!type) return null;
  const meta = META[type];

  const reset = () => {
    setTopic("");
    setGrade("");
    setResult(null);
    setLoading(false);
    setSaved(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = () => {
    if (!canUse(type)) {
      onNeedUpgrade();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResult(buildMockResult(type, topic, grade));
      registerUse(type);
      setLoading(false);
    }, 1100);
  };

  const resultTitle = `${meta.title}: ${topic || "без темы"}`;

  const handleDownload = () => {
    if (!result) return;
    downloadTxt(resultTitle, [resultTitle, "", ...result]);
  };

  const handleSave = async () => {
    if (!result) return;
    if (!token || !user) {
      onNeedAuth();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "save_material",
          type,
          title: resultTitle,
          content: result.join("\n"),
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">{meta.icon}</span>
            {meta.title}
          </DialogTitle>
          <DialogDescription>
            {isPaid
              ? "Безлимитная генерация по вашему тарифу"
              : `Осталось бесплатных генераций: ${remaining(type)} из 3`}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{meta.subject}</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Фотосинтез, Дроби, Великая Отечественная война..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Класс / возраст</label>
              <Input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Например: 7 класс"
              />
            </div>
            <Button
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={17} className="animate-spin" />
                  Генерирую...
                </>
              ) : (
                <>
                  <Icon name="Wand2" size={17} />
                  Сгенерировать
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-4 animate-fade-in">
            <div className="rounded-xl border border-border bg-secondary/50 p-4 max-h-80 overflow-y-auto">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Готовый {meta.resultLabel}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed">
                {result.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <Icon name="CheckCircle2" size={15} className="text-primary shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                <Icon name="RotateCcw" size={16} />
                Заново
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saving ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : saved ? (
                  <Icon name="CheckCircle2" size={16} className="text-primary" />
                ) : (
                  <Icon name="Save" size={16} />
                )}
                {saved ? "Сохранено" : "В кабинет"}
              </Button>
              <Button className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDownload}>
                <Icon name="Download" size={16} />
                Скачать .txt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorModal;
