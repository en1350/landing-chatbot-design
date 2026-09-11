import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";

/* ---------- Задание 6: Анализ с конца ---------- */

interface BackwardsOption {
  value: string;
  text: string;
}

interface BackwardsTask {
  question: string;
  options: BackwardsOption[];
  correct: string;
  explanation: string;
  pseudocode: string;
}

const BACKWARDS_TASKS: BackwardsTask[] = [
  {
    question:
      "У вас есть 9 монет, одна из которых фальшивая и легче остальных. Какое минимальное количество взвешиваний на чашечных весах без гирь нужно, чтобы гарантированно найти фальшивую монету?",
    options: [
      { value: "a", text: "Одно взвешивание" },
      { value: "b", text: "Два взвешивания" },
      { value: "c", text: "Три взвешивания" },
    ],
    correct: "b",
    explanation:
      "Идём с конца: на последнем шаге мы должны сравнить 3 монеты за одно взвешивание. Значит, за шаг до этого надо было оставить ровно 3 монеты. 9 монет делим на 3 группы по 3 — первое взвешивание оставляет нам одну из групп. Второе взвешивание находит фальшивку.",
    pseudocode: `// Анализ с конца: на последнем шаге ищем среди 3 монет
function findFake(coins):
    if len(coins) == 1:
        return coins[0]

    // Шаг назад: делим на 3 равные кучки
    g1, g2, g3 = split(coins, 3)

    if weight(g1) == weight(g2):
        target = g3            // фальшивая в 3-й группе
    else if weight(g1) < weight(g2):
        target = g1            // легче = фальшивая
    else:
        target = g2

    return findFake(target)    // рекурсивно сужаем задачу`,
  },
  {
    question:
      "Крестьянин собрал яблоки и вышел из сада через 3 ворот. Каждому стражнику он отдавал половину имеющихся яблок плюс одно. После третьего стражника у него осталось 1 яблоко. Сколько яблок было изначально?",
    options: [
      { value: "a", text: "10 яблок" },
      { value: "b", text: "16 яблок" },
      { value: "c", text: "22 яблока" },
      { value: "d", text: "26 яблок" },
    ],
    correct: "c",
    explanation:
      "Классический анализ с конца. После 3-го стражника осталось 1 яблоко. Значит, ДО встречи с ним было (1 + 1) × 2 = 4. До 2-го стражника: (4 + 1) × 2 = 10. До 1-го стражника: (10 + 1) × 2 = 22. Изначально было 22 яблока.",
    pseudocode: `// Идём от конца к началу: обратная операция
// Если отдал половину+1, то осталось X/2 - 1
// Значит ДО было: (X + 1) * 2

function countApples(final_apples, guards):
    current = final_apples

    for i from 1 to guards:
        current = (current + 1) * 2
        // шаг назад через одни ворота

    return current

// Пример: countApples(1, 3) = 22`,
  },
  {
    question:
      "Улитка ползёт вверх по столбу высотой 10 метров. За день она поднимается на 3 метра, а за ночь сползает на 2 метра. За сколько дней улитка доберётся до вершины?",
    options: [
      { value: "a", text: "7 дней" },
      { value: "b", text: "8 дней" },
      { value: "c", text: "10 дней" },
      { value: "d", text: "12 дней" },
    ],
    correct: "b",
    explanation:
      "Смотрим с конца: в последний день улитка поднимается на 3 м и достигает верха, больше не сползая. Значит, перед этим утром она должна быть на высоте 10 − 3 = 7 м. Каждые сутки нетто она поднимается на 1 м. За 7 суток — 7 м. На 8-й день поднимается на 3 м и достигает вершины. Ответ: 8 дней.",
    pseudocode: `// Анализ с конца: последний рывок не имеет "отката"
function snailDays(height, day_climb, night_slip):
    // Последний день: улитка поднимается day_climb
    // и не сползает обратно
    target_before_last = height - day_climb

    if target_before_last <= 0:
        return 1

    // Нетто-прогресс за полные сутки
    net_per_day = day_climb - night_slip
    full_days = ceil(target_before_last / net_per_day)

    return full_days + 1   // +1 за финальный подъём

// Пример: snailDays(10, 3, 2) = 8`,
  },
];

const BackwardsAnalysisTask = () => {
  const [taskIndex, setTaskIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "empty">("idle");
  const [solutionShown, setSolutionShown] = useState(false);

  const task = BACKWARDS_TASKS[taskIndex];

  const goTo = (index: number) => {
    setTaskIndex(index);
    setSelected(null);
    setStatus("idle");
    setSolutionShown(false);
  };

  const check = () => {
    if (!selected) {
      setStatus("empty");
      return;
    }
    if (selected === task.correct) {
      setStatus("correct");
      setSolutionShown(true);
    } else {
      setStatus("wrong");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Progress value={((taskIndex + 1) / BACKWARDS_TASKS.length) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground text-right mt-1.5">
          Задача {taskIndex + 1} из {BACKWARDS_TASKS.length}
        </p>
      </div>

      <div className="rounded-xl border-l-4 border-primary bg-secondary/40 p-4">
        <p className="text-sm leading-relaxed">{task.question}</p>
      </div>

      <div className="space-y-2">
        {task.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                setSelected(opt.value);
                setStatus("idle");
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2.5">
        <Button className="flex-[2] h-11 gap-2" onClick={check}>
          <Icon name="CheckCircle2" size={16} />
          Проверить ответ
        </Button>
        <Button
          variant="secondary"
          className="flex-1 h-11 gap-2"
          onClick={() => setSolutionShown(true)}
        >
          <Icon name="Lightbulb" size={16} />
          Решение
        </Button>
      </div>

      {status === "empty" && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <Icon name="AlertCircle" size={14} />
          Пожалуйста, выберите один из вариантов
        </p>
      )}
      {status === "correct" && (
        <p className="text-sm text-primary font-semibold flex items-center gap-1.5">
          <Icon name="CheckCircle2" size={14} />
          Верно! Отличная работа.
        </p>
      )}
      {status === "wrong" && (
        <p className="text-sm text-destructive font-semibold flex items-center gap-1.5">
          <Icon name="XCircle" size={14} />
          Неверно. Подумайте ещё раз.
        </p>
      )}

      {solutionShown && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-xl border border-amber-300/50 bg-amber-500/10 p-4">
            <p className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
              <Icon name="BookOpen" size={15} />
              Пояснение
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{task.explanation}</p>
          </div>
          <pre className="rounded-xl bg-[#2d2d2d] text-[#f8f8f2] p-4 text-xs leading-relaxed overflow-x-auto font-mono whitespace-pre">
            {task.pseudocode}
          </pre>
        </div>
      )}

      <div className="flex justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={taskIndex === 0}
          onClick={() => goTo(taskIndex - 1)}
        >
          <Icon name="ArrowLeft" size={14} />
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={taskIndex === BACKWARDS_TASKS.length - 1}
          onClick={() => goTo(taskIndex + 1)}
        >
          Вперёд
          <Icon name="ArrowRight" size={14} />
        </Button>
      </div>
    </div>
  );
};

export default BackwardsAnalysisTask;
