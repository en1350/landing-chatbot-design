import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";

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

export default AlgorithmsTask;
