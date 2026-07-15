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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const META: Record<GeneratorType, { title: string; icon: string; resultLabel: string }> = {
  lesson: { title: "Генератор уроков", icon: "📘", resultLabel: "план урока" },
  game: { title: "Генератор игры", icon: "🎲", resultLabel: "сценарий игры" },
  intensive: { title: "Генератор интенсивов и мастер-классов", icon: "🚀", resultLabel: "программа интенсива" },
  task: { title: "Генератор заданий", icon: "📝", resultLabel: "комплект заданий" },
};

interface LessonFields {
  subject: string;
  topic: string;
  goal: string;
  tasks: string;
  technology: string;
  ageCount: string;
  duration: "45" | "90";
}

interface GameFields {
  subject: string;
  duration: "5" | "15" | "45";
  peopleCount: string;
}

interface SimpleFields {
  topic: string;
  grade: string;
}

const LESSON_TIME_MAP: Record<"45" | "90", number[]> = {
  "45": [3, 7, 15, 15, 3, 2],
  "90": [5, 15, 30, 30, 7, 3],
};

function buildLessonResult(f: LessonFields): string[] {
  const subject = f.subject || "дисциплина не указана";
  const topic = f.topic || "новая тема";
  const goal = f.goal || `сформировать понимание темы «${topic}»`;
  const taskList = f.tasks
    .split(/\n|,/)
    .map((t) => t.trim())
    .filter(Boolean);
  const technology = f.technology || "смешанное обучение";
  const ageCount = f.ageCount || "не указано";
  const [t1, t2, t3, t4, t5, t6] = LESSON_TIME_MAP[f.duration];

  const lines = [
    `Предмет/дисциплина: ${subject}`,
    `Тема: ${topic}`,
    `Возраст / количество человек: ${ageCount}`,
    `Технология обучения: ${technology}`,
    `Время урока: ${f.duration} мин`,
    `Цель: ${goal}`,
  ];

  if (taskList.length) {
    lines.push("Задачи:");
    taskList.forEach((t) => lines.push(`— ${t}`));
  }

  lines.push(
    "",
    "Структура урока:",
    `1. Организационный момент — ${t1} мин: приветствие, проверка готовности, настрой на работу`,
    `2. Актуализация темы — ${t2} мин: повторение опорных знаний, связь с темой «${topic}»`,
    `3. Сообщение новой темы — ${t3} мин: объяснение материала по теме «${topic}» с использованием технологии «${technology}»`,
    `4. Закрепление / выполнение практической части — ${t4} мин: практические задания, работа в парах или группах`,
    `5. Рефлексия — ${t5} мин: обратная связь, самооценка, вывод по уроку`,
    `6. Домашнее задание — ${t6} мин: закрепление темы «${topic}» дома`,
  );

  return lines;
}

const GAME_TEMPLATES: Record<"5" | "15" | "45", (subject: string, people: string) => string[]> = {
  "5": (subject, people) => [
    `Формат: блиц-разминка по предмету «${subject}»`,
    `Участников: ${people}`,
    "1. Быстрые вопросы на знание темы — 3 мин",
    "2. Подсчёт очков и объявление победителя — 2 мин",
  ],
  "15": (subject, people) => [
    `Формат: короткая командная игра по предмету «${subject}»`,
    `Участников: ${people}`,
    "1. Деление на команды и объяснение правил — 2 мин",
    "2. Раунд 1 — вопросы на знание темы — 5 мин",
    "3. Раунд 2 — практический кейс — 5 мин",
    "4. Подведение итогов — 3 мин",
  ],
  "45": (subject, people) => [
    `Формат: полноценная командная игра по предмету «${subject}»`,
    `Участников: ${people}`,
    "1. Деление на команды, объяснение правил — 5 мин",
    "2. Раунд 1 — Разминка: быстрые вопросы на знание темы — 10 мин",
    "3. Раунд 2 — Кейсы: разбор практических ситуаций — 15 мин",
    "4. Раунд 3 — Финал: блиц на скорость реакции — 10 мин",
    "5. Награждение и разбор ошибок — 5 мин",
  ],
};

function buildGameResult(f: GameFields): string[] {
  const subject = f.subject || "дисциплина не указана";
  const people = f.peopleCount || "не указано";
  return GAME_TEMPLATES[f.duration](subject, people);
}

function buildSimpleResult(type: "intensive" | "task", f: SimpleFields): string[] {
  const t = f.topic || "новая тема";
  const g = f.grade || "7";
  if (type === "intensive") {
    return [
      `Интенсив «${t}» — 3 дня, ${g} класс`,
      "День 1: погружение в тему, диагностика знаний",
      "День 2: практикум в мини-группах, разбор кейсов",
      "День 3: проектная защита и обратная связь",
      "Материалы: рабочая тетрадь, чек-листы, итоговый тест",
    ];
  }
  return [
    `Комплект заданий по теме «${t}», ${g} класс`,
    "Задание 1 (базовый уровень): найти и объяснить понятие",
    "Задание 2 (средний уровень): применить знания на примере",
    "Задание 3 (продвинутый уровень): проанализировать и аргументировать",
    "Критерии оценивания приложены к каждому заданию",
  ];
}

const GeneratorModal = ({ open, onClose, type, onNeedUpgrade, onNeedAuth }: GeneratorModalProps) => {
  const { canUse, registerUse, remaining, isPaid } = useUsage();
  const { token, user } = useAuth();

  const [lessonFields, setLessonFields] = useState<LessonFields>({
    subject: "",
    topic: "",
    goal: "",
    tasks: "",
    technology: "",
    ageCount: "",
    duration: "45",
  });
  const [gameFields, setGameFields] = useState<GameFields>({
    subject: "",
    duration: "15",
    peopleCount: "",
  });
  const [simpleFields, setSimpleFields] = useState<SimpleFields>({ topic: "", grade: "" });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!type) return null;
  const meta = META[type];

  const reset = () => {
    setLessonFields({ subject: "", topic: "", goal: "", tasks: "", technology: "", ageCount: "", duration: "45" });
    setGameFields({ subject: "", duration: "15", peopleCount: "" });
    setSimpleFields({ topic: "", grade: "" });
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
      if (type === "lesson") setResult(buildLessonResult(lessonFields));
      else if (type === "game") setResult(buildGameResult(gameFields));
      else setResult(buildSimpleResult(type, simpleFields));
      registerUse(type);
      setLoading(false);
    }, 1100);
  };

  const resultTopic =
    type === "lesson" ? lessonFields.topic : type === "game" ? gameFields.subject : simpleFields.topic;
  const resultTitle = `${meta.title}: ${resultTopic || "без темы"}`;

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            {type === "lesson" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
                  <Input
                    value={lessonFields.subject}
                    onChange={(e) => setLessonFields((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="Например: Биология, Математика, История..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Тема</label>
                  <Input
                    value={lessonFields.topic}
                    onChange={(e) => setLessonFields((s) => ({ ...s, topic: e.target.value }))}
                    placeholder="Например: Фотосинтез, Дроби..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Цель</label>
                  <Input
                    value={lessonFields.goal}
                    onChange={(e) => setLessonFields((s) => ({ ...s, goal: e.target.value }))}
                    placeholder="Например: сформировать понимание процесса фотосинтеза"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Задачи</label>
                  <Textarea
                    value={lessonFields.tasks}
                    onChange={(e) => setLessonFields((s) => ({ ...s, tasks: e.target.value }))}
                    placeholder="Каждую задачу с новой строки или через запятую"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Технология обучения</label>
                  <Input
                    value={lessonFields.technology}
                    onChange={(e) => setLessonFields((s) => ({ ...s, technology: e.target.value }))}
                    placeholder="Например: проблемное обучение, смешанное обучение"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Возраст / количество человек</label>
                  <Input
                    value={lessonFields.ageCount}
                    onChange={(e) => setLessonFields((s) => ({ ...s, ageCount: e.target.value }))}
                    placeholder="Например: 7 класс, 25 человек"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Время урока</label>
                  <Select
                    value={lessonFields.duration}
                    onValueChange={(v: "45" | "90") => setLessonFields((s) => ({ ...s, duration: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45 минут</SelectItem>
                      <SelectItem value="90">90 минут</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "game" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
                  <Input
                    value={gameFields.subject}
                    onChange={(e) => setGameFields((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="Например: Английский язык, Химия..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Время</label>
                  <Select
                    value={gameFields.duration}
                    onValueChange={(v: "5" | "15" | "45") => setGameFields((s) => ({ ...s, duration: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 минут</SelectItem>
                      <SelectItem value="15">15 минут</SelectItem>
                      <SelectItem value="45">45 минут</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Количество человек</label>
                  <Input
                    value={gameFields.peopleCount}
                    onChange={(e) => setGameFields((s) => ({ ...s, peopleCount: e.target.value }))}
                    placeholder="Например: 20"
                  />
                </div>
              </>
            )}

            {(type === "intensive" || type === "task") && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {type === "intensive" ? "Тема интенсива" : "Тема задания"}
                  </label>
                  <Input
                    value={simpleFields.topic}
                    onChange={(e) => setSimpleFields((s) => ({ ...s, topic: e.target.value }))}
                    placeholder="Например: Критическое мышление"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Класс / возраст</label>
                  <Input
                    value={simpleFields.grade}
                    onChange={(e) => setSimpleFields((s) => ({ ...s, grade: e.target.value }))}
                    placeholder="Например: 7 класс"
                  />
                </div>
              </>
            )}

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
                {result.map((line, i) =>
                  line === "" ? (
                    <li key={i} className="h-1" />
                  ) : (
                    <li key={i} className="flex gap-2">
                      <Icon name="CheckCircle2" size={15} className="text-primary shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  )
                )}
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
