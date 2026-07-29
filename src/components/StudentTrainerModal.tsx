import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";

interface StudentTrainerModalProps {
  open: boolean;
  onClose: () => void;
}

/* ---------- Задание 1: Тест ---------- */

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

const QUIZ: QuizQuestion[] = [
  {
    q: "Что из перечисленного НЕ является видом информации по форме представления?",
    options: ["Текстовая", "Визуальная", "Числовая", "Графическая"],
    correct: 1,
  },
  {
    q: "Какой процесс работы с информацией включает сортировку и фильтрацию данных?",
    options: ["Сбор", "Хранение", "Обработка", "Передача"],
    correct: 2,
  },
  {
    q: "Какая информация считается достоверной?",
    options: ["Новая", "Соответствующая действительности", "Быстро полученная", "Подробная"],
    correct: 1,
  },
  {
    q: "Что НЕ относится к способам защиты информации?",
    options: ["Шифрование", "Резервное копирование", "Удаление всех данных", "Контроль доступа"],
    correct: 2,
  },
  {
    q: "К визуальной информации относится:",
    options: ["Музыка", "Текст книги", "Запах цветов", "Вкус еды"],
    correct: 1,
  },
];

const QuizTask = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const score = QUIZ.reduce((acc, item, i) => (answers[i] === item.correct ? acc + 1 : acc), 0);

  const reset = () => {
    setAnswers({});
    setChecked(false);
  };

  return (
    <div className="space-y-5">
      {QUIZ.map((item, i) => (
        <div key={i}>
          <p className="font-medium text-sm mb-2">
            {i + 1}. {item.q}
          </p>
          <div className="space-y-1.5">
            {item.options.map((opt, oi) => {
              const isSelected = answers[i] === oi;
              const isCorrect = oi === item.correct;
              return (
                <button
                  key={oi}
                  onClick={() => !checked && setAnswers((a) => ({ ...a, [i]: oi }))}
                  disabled={checked}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
                    checked && isCorrect
                      ? "border-primary bg-primary/10"
                      : checked && isSelected && !isCorrect
                      ? "border-destructive bg-destructive/10"
                      : isSelected
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!checked ? (
        <Button
          className="w-full h-11 gap-2"
          onClick={() => setChecked(true)}
          disabled={Object.keys(answers).length < QUIZ.length}
        >
          <Icon name="CheckCircle2" size={16} />
          Проверить ответы
        </Button>
      ) : (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-3 animate-fade-in">
          <p className="font-display text-xl font-bold">
            {score} из {QUIZ.length}
          </p>
          <p className="text-sm text-muted-foreground">правильных ответов</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
            <Icon name="RotateCcw" size={14} />
            Пройти ещё раз
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------- Задание 2: Классификация ---------- */

const CLASSIFY_ITEMS = [
  { label: "«Температура воздуха 25°C»", correct: "numeric" },
  { label: "«Музыкальная композиция»", correct: "sound" },
  { label: "«Фотография пейзажа»", correct: "graphic" },
  { label: "«Статья в журнале»", correct: "text" },
];

const CLASSIFY_OPTIONS = [
  { value: "text", label: "Текстовая" },
  { value: "numeric", label: "Числовая" },
  { value: "graphic", label: "Графическая" },
  { value: "sound", label: "Звуковая" },
];

const ClassifyTask = () => {
  const [values, setValues] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const correctCount = CLASSIFY_ITEMS.reduce(
    (acc, item, i) => (values[i] === item.correct ? acc + 1 : acc),
    0
  );

  const reset = () => {
    setValues({});
    setChecked(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Определите вид информации по форме представления для каждого примера:
      </p>
      {CLASSIFY_ITEMS.map((item, i) => {
        const isCorrect = checked && values[i] === item.correct;
        const isWrong = checked && values[i] && values[i] !== item.correct;
        return (
          <div
            key={i}
            className={`rounded-xl border p-3.5 transition-colors ${
              isCorrect
                ? "border-primary bg-primary/5"
                : isWrong
                ? "border-destructive bg-destructive/5"
                : "border-border"
            }`}
          >
            <p className="font-medium text-sm mb-2">{item.label}</p>
            <Select
              value={values[i] || ""}
              onValueChange={(v) => !checked && setValues((s) => ({ ...s, [i]: v }))}
              disabled={checked}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Выберите вид информации..." />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {!checked ? (
        <Button
          className="w-full h-11 gap-2"
          onClick={() => setChecked(true)}
          disabled={Object.keys(values).length < CLASSIFY_ITEMS.length}
        >
          <Icon name="CheckCircle2" size={16} />
          Проверить классификацию
        </Button>
      ) : (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-3 animate-fade-in">
          <p className="font-display text-xl font-bold">
            {correctCount} из {CLASSIFY_ITEMS.length}
          </p>
          <p className="text-sm text-muted-foreground">верных ответов</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
            <Icon name="RotateCcw" size={14} />
            Попробовать снова
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------- Задание 3: Сопоставление процессов ---------- */

const MATCH_ITEMS = [
  { label: "«Сохранение файла на флеш-накопитель»", correct: "storage" },
  { label: "«Отправка электронного письма»", correct: "transfer" },
  { label: "«Вычисление среднего значения в таблице»", correct: "processing" },
  { label: "«Установка пароля на документ»", correct: "protection" },
];

const MATCH_OPTIONS = [
  { value: "collection", label: "Сбор" },
  { value: "storage", label: "Хранение" },
  { value: "processing", label: "Обработка" },
  { value: "transfer", label: "Передача" },
  { value: "protection", label: "Защита" },
];

const MatchTask = () => {
  const [values, setValues] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const correctCount = MATCH_ITEMS.reduce(
    (acc, item, i) => (values[i] === item.correct ? acc + 1 : acc),
    0
  );

  const reset = () => {
    setValues({});
    setChecked(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Сопоставьте действие с процессом работы с информацией:
      </p>
      {MATCH_ITEMS.map((item, i) => {
        const isCorrect = checked && values[i] === item.correct;
        const isWrong = checked && values[i] && values[i] !== item.correct;
        return (
          <div
            key={i}
            className={`rounded-xl border p-3.5 transition-colors ${
              isCorrect
                ? "border-primary bg-primary/5"
                : isWrong
                ? "border-destructive bg-destructive/5"
                : "border-border"
            }`}
          >
            <p className="font-medium text-sm mb-2">{item.label}</p>
            <Select
              value={values[i] || ""}
              onValueChange={(v) => !checked && setValues((s) => ({ ...s, [i]: v }))}
              disabled={checked}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Выберите процесс..." />
              </SelectTrigger>
              <SelectContent>
                {MATCH_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {!checked ? (
        <Button
          className="w-full h-11 gap-2"
          onClick={() => setChecked(true)}
          disabled={Object.keys(values).length < MATCH_ITEMS.length}
        >
          <Icon name="CheckCircle2" size={16} />
          Проверить сопоставление
        </Button>
      ) : (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-3 animate-fade-in">
          <p className="font-display text-xl font-bold">
            {correctCount} из {MATCH_ITEMS.length}
          </p>
          <p className="text-sm text-muted-foreground">верных сопоставлений</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
            <Icon name="RotateCcw" size={14} />
            Попробовать снова
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------- Задание 4: Обработчик текста ---------- */

type TextOp = "uppercase" | "lowercase" | "reverse" | "length" | "words" | "removeSpaces";

const TEXT_OPS: { value: TextOp; label: string }[] = [
  { value: "uppercase", label: "В верхний регистр" },
  { value: "lowercase", label: "В нижний регистр" },
  { value: "reverse", label: "Развернуть текст" },
  { value: "length", label: "Подсчитать длину" },
  { value: "words", label: "Подсчитать слова" },
  { value: "removeSpaces", label: "Удалить пробелы" },
];

const TextProcessorTask = () => {
  const [input, setInput] = useState("");
  const [op, setOp] = useState<TextOp>("uppercase");
  const [result, setResult] = useState<string | null>(null);

  const process = () => {
    if (!input.trim()) {
      setResult("⚠️ Введите текст для обработки");
      return;
    }
    switch (op) {
      case "uppercase":
        setResult(input.toUpperCase());
        break;
      case "lowercase":
        setResult(input.toLowerCase());
        break;
      case "reverse":
        setResult(input.split("").reverse().join(""));
        break;
      case "length":
        setResult(`Длина текста: ${input.length} символов`);
        break;
      case "words": {
        const words = input.trim().split(/\s+/).filter(Boolean);
        setResult(`Количество слов: ${words.length}`);
        break;
      }
      case "removeSpaces":
        setResult(input.replace(/\s/g, ""));
        break;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Попробуйте обработать текст с помощью инструмента:
      </p>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Введите текст для обработки..."
        onKeyDown={(e) => e.key === "Enter" && process()}
      />
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Select value={op} onValueChange={(v) => setOp(v as TextOp)}>
          <SelectTrigger className="sm:flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_OPS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={process} className="gap-2 shrink-0">
          <Icon name="Wand2" size={15} />
          Обработать
        </Button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-secondary/40 p-4 min-h-[80px]">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
          Результат
        </p>
        <p className="text-sm break-words">{result ?? "Здесь появится результат..."}</p>
      </div>
    </div>
  );
};

/* ---------- Основной компонент ---------- */

const StudentTrainerModal = ({ open, onClose }: StudentTrainerModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🧠</span> Тренажёр для учеников
          </DialogTitle>
          <DialogDescription>
            Тема «Работа с информацией» — тест, классификация, сопоставление и обработка текста
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quiz" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full h-auto">
            <TabsTrigger value="quiz" className="text-xs sm:text-sm py-2">
              Тест
            </TabsTrigger>
            <TabsTrigger value="classify" className="text-xs sm:text-sm py-2">
              Классификация
            </TabsTrigger>
            <TabsTrigger value="match" className="text-xs sm:text-sm py-2">
              Сопоставление
            </TabsTrigger>
            <TabsTrigger value="processor" className="text-xs sm:text-sm py-2">
              Обработчик
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="mt-5">
            <QuizTask />
          </TabsContent>
          <TabsContent value="classify" className="mt-5">
            <ClassifyTask />
          </TabsContent>
          <TabsContent value="match" className="mt-5">
            <MatchTask />
          </TabsContent>
          <TabsContent value="processor" className="mt-5">
            <TextProcessorTask />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentTrainerModal;
