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
import { Progress } from "@/components/ui/progress";
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

/* ---------- Задание 5: Алгоритмические конструкции ---------- */

interface AlgoQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ALGO_THEORY = [
  {
    icon: "📏",
    title: "Линейный алгоритм",
    text: "Команды выполняются последовательно, друг за другом, сверху вниз, без пропусков и повторений.",
    example: "Пример: Инструкция по завариванию чая (налить воду → положить пакетик → залить кипятком).",
  },
  {
    icon: "🔀",
    title: "Ветвление",
    text: "Выбор одного из нескольких возможных путей выполнения в зависимости от истинности условия (Да/Нет).",
    example: "Пример: Если идёт дождь, то взять зонт, иначе надеть кепку.",
  },
  {
    icon: "🔄",
    title: "Цикл",
    text: "Многократное выполнение одинаковой последовательности действий (тела цикла). Бывает с параметром, с предусловием и с постусловием.",
    example: "Пример: Чистить картошку, пока она не закончится в кастрюле.",
  },
  {
    icon: "📦",
    title: "Вспомогательный алгоритм",
    text: "Самостоятельная часть алгоритма, оформленная как отдельная единица, которую можно многократно вызывать по имени (процедура или функция).",
    example: "Пример: Подпрограмма «Нарисовать круг», которую вызывают для рисования колёс машины.",
  },
];

const ALGO_QUESTIONS: AlgoQuestion[] = [
  {
    question:
      "Какая алгоритмическая конструкция описывается фразой: «Если температура ниже нуля, то включить обогреватель, иначе выключить»?",
    options: ["Линейный алгоритм", "Ветвление", "Цикл с постусловием", "Вспомогательный алгоритм"],
    correctIndex: 1,
    explanation:
      "Это классическое ветвление (условная конструкция). Выполнение действия зависит от истинности проверяемого условия (температура < 0).",
  },
  {
    question: "Какую геометрическую фигуру в блок-схемах принято использовать для обозначения условия (ветвления)?",
    options: ["Прямоугольник", "Овал (терминатор)", "Ромб", "Параллелограмм"],
    correctIndex: 2,
    explanation:
      "В стандартах оформления блок-схем (ГОСТ) ромб используется для обозначения блока принятия решения (проверки условия), из которого выходит две или более стрелок (Да/Нет).",
  },
  {
    question: "Чем цикл с постусловием (do-while) принципиально отличается от цикла с предусловием (while)?",
    options: [
      "Цикл с постусловием всегда выполняется хотя бы один раз",
      "Цикл с постусловием не может быть бесконечным",
      "Цикл с постусловием выполняется быстрее",
      "Ничем, это просто разные названия одной конструкции",
    ],
    correctIndex: 0,
    explanation:
      "В цикле с постусловием проверка условия происходит в конце. Поэтому тело цикла гарантированно выполнится минимум один раз, даже если условие изначально ложно.",
  },
  {
    question: "Для чего в программировании и алгоритмике используют вспомогательные алгоритмы (подпрограммы, функции)?",
    options: [
      "Чтобы сделать код длиннее и сложнее",
      "Чтобы избежать многократного написания одного и того же кода (принцип DRY)",
      "Чтобы алгоритм выполнялся строго линейно",
      "Чтобы исключить возможность использования переменных",
    ],
    correctIndex: 1,
    explanation:
      "Главная цель вспомогательных алгоритмов — декомпозиция (разбиение сложной задачи на простые) и переиспользование кода. Один раз написанную функцию можно вызывать многократно по имени.",
  },
  {
    question: "Укажите пример, который лучше всего описывает линейный алгоритм.",
    options: [
      "Поиск максимального числа в массиве",
      "Сортировка списка студентов по алфавиту",
      "Вычисление площади прямоугольника по формуле S = a * b",
      "Повторение слова «Привет» 10 раз",
    ],
    correctIndex: 2,
    explanation:
      "Вычисление по формуле — это строгая последовательность действий без проверок условий и повторений. Остальные варианты требуют циклов или ветвлений.",
  },
];

type AlgoStage = "theory" | "quiz" | "result";

const AlgorithmsTask = () => {
  const [stage, setStage] = useState<AlgoStage>("theory");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const reset = () => {
    setStage("theory");
    setStep(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
  };

  const q = ALGO_QUESTIONS[step];
  const isCorrect = selected === q?.correctIndex;

  const check = () => {
    if (selected === null || answered) return;
    setAnswered(true);
    if (selected === q.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (step + 1 < ALGO_QUESTIONS.length) {
      setStep((s) => s + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setStage("result");
    }
  };

  if (stage === "theory") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Изучите базовые конструкции перед началом тестирования
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ALGO_THEORY.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-secondary/30 p-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all"
            >
              <h4 className="flex items-center gap-2 font-display font-bold text-primary mb-1.5">
                <span className="text-lg">{item.icon}</span> {item.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              <p className="mt-2 text-xs rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 italic">
                {item.example}
              </p>
            </div>
          ))}
        </div>
        <Button className="w-full h-11 gap-2" onClick={() => setStage("quiz")}>
          <Icon name="Rocket" size={16} />
          Начать проверку знаний
        </Button>
      </div>
    );
  }

  if (stage === "result") {
    const message =
      score === ALGO_QUESTIONS.length
        ? "Блестяще! Вы отлично усвоили теорию алгоритмических конструкций. Вам покорятся любые блок-схемы!"
        : score >= 3
        ? "Хороший результат! Вы понимаете основы, но стоит ещё раз перечитать справочник про виды циклов и блоки блок-схем."
        : "Не расстраивайтесь! Алгоритмика требует практики. Вернитесь к началу, внимательно изучите карточки и попробуйте снова.";

    return (
      <div className="text-center py-4 space-y-4 animate-fade-in">
        <div className="mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-coral text-primary-foreground shadow-lg">
          <span className="font-display text-3xl font-bold leading-none">{score}</span>
          <span className="text-xs opacity-90">из {ALGO_QUESTIONS.length}</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{message}</p>
        <Button variant="outline" className="gap-2" onClick={reset}>
          <Icon name="RotateCcw" size={14} />
          Пройти ещё раз
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Progress value={((answered ? step + 1 : step) / ALGO_QUESTIONS.length) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground text-right mt-1.5">
          Вопрос {step + 1} из {ALGO_QUESTIONS.length}
        </p>
      </div>

      <p className="font-medium leading-relaxed">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const showCorrect = answered && i === q.correctIndex;
          const showWrong = answered && isSelected && i !== q.correctIndex;
          return (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={`w-full flex items-start gap-3 text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                showCorrect
                  ? "border-primary bg-primary/10"
                  : showWrong
                  ? "border-destructive bg-destructive/10"
                  : isSelected
                  ? "border-primary/60 bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span
                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                  showCorrect
                    ? "border-primary bg-primary"
                    : showWrong
                    ? "border-destructive bg-destructive"
                    : isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                }`}
              />
              {opt}
            </button>
          );
        })}
      </div>

      {!answered ? (
        <Button className="w-full h-11 gap-2" onClick={check} disabled={selected === null}>
          <Icon name="CheckCircle2" size={16} />
          Проверить ответ
        </Button>
      ) : (
        <>
          <div
            className={`rounded-xl border p-4 animate-fade-in ${
              isCorrect
                ? "border-primary/30 bg-primary/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <p className="font-semibold text-sm mb-1">
              {isCorrect ? "✅ Абсолютно верно!" : "❌ Не совсем так"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
          </div>
          <Button className="w-full h-11 gap-2" onClick={next}>
            <Icon name="ArrowRight" size={16} />
            {step + 1 < ALGO_QUESTIONS.length ? "Следующий вопрос" : "Завершить"}
          </Button>
        </>
      )}
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
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full h-auto gap-1">
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
            <TabsTrigger value="algorithms" className="text-xs sm:text-sm py-2">
              Алгоритмы
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
          <TabsContent value="algorithms" className="mt-5">
            <AlgorithmsTask />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentTrainerModal;