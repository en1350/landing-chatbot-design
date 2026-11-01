import { GeneratorType } from "@/context/AuthContext";

export const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

export const META: Record<GeneratorType, { title: string; icon: string; resultLabel: string }> = {
  lesson: { title: "Генератор уроков", icon: "📘", resultLabel: "план урока" },
  game: { title: "Генератор игры", icon: "🎲", resultLabel: "сценарий игры" },
  intensive: { title: "Генератор интенсивов и мастер-классов", icon: "🚀", resultLabel: "программа мероприятия" },
  task: { title: "Генератор заданий", icon: "📝", resultLabel: "комплект заданий" },
  quiz: { title: "Генератор тестовых заданий", icon: "✅", resultLabel: "тест" },
  antiplagiat: { title: "Антиплагиат", icon: "🔍", resultLabel: "заключение" },
};

export interface LessonFields {
  subject: string;
  topic: string;
  goal: string;
  tasks: string;
  technology: string;
  ageCount: string;
  duration: "45" | "90";
  lessonType: "theory" | "practice";
  competencies: string[];
  regionalComponent: string;
  professionalOrientation: string;
}

export interface GameFields {
  subject: string;
  duration: "5" | "15" | "45";
  peopleCount: string;
  regionalComponent: string;
  professionalOrientation: string;
}

export interface IntensiveFields {
  topic: string;
  audience: "schoolchildren" | "students" | "adults";
  duration: "15min" | "30min" | "45min" | "90min" | "1day" | "2days";
  format: "intensive" | "masterclass" | "workshop" | "hackathon" | "project_lab" | "immersive";
  goal: string;
  regionalComponent: string;
  professionalOrientation: string;
}

export interface TaskFields {
  subject: string;
  topic: string;
  goal: string;
  component: "cognitive" | "creative" | "critical" | "communicative" | "balanced";
  competencies: string[];
  regionalComponent: string;
  professionalOrientation: string;
}

export interface QuizFields {
  subject: string;
  topic: string;
  questionCount: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionTypes: string[];
  regionalComponent: string;
  professionalOrientation: string;
}

export const AUDIENCE_OPTIONS: { value: IntensiveFields["audience"]; label: string }[] = [
  { value: "schoolchildren", label: "Школьники" },
  { value: "students", label: "Студенты" },
  { value: "adults", label: "Взрослые" },
];

export const INTENSIVE_DURATION_OPTIONS: { value: IntensiveFields["duration"]; label: string }[] = [
  { value: "15min", label: "15 минут" },
  { value: "30min", label: "30 минут" },
  { value: "45min", label: "45 минут" },
  { value: "90min", label: "90 минут" },
  { value: "1day", label: "1 день" },
  { value: "2days", label: "2 дня" },
];

export const FORMAT_OPTIONS: { value: IntensiveFields["format"]; label: string }[] = [
  { value: "intensive", label: "Интенсив" },
  { value: "masterclass", label: "Мастер-класс" },
  { value: "workshop", label: "Воркшоп" },
  { value: "hackathon", label: "Хакатон" },
  { value: "project_lab", label: "Проектная лаборатория" },
  { value: "immersive", label: "Иммерсивный интенсив" },
];

export const LESSON_TYPE_OPTIONS: { value: LessonFields["lessonType"]; label: string }[] = [
  { value: "theory", label: "Теоретическое занятие" },
  { value: "practice", label: "Практическое занятие" },
];

export const COMPONENT_OPTIONS: { value: TaskFields["component"]; label: string }[] = [
  { value: "balanced", label: "Все компоненты сбалансированно" },
  { value: "cognitive", label: "Когнитивный компонент" },
  { value: "creative", label: "Креативный компонент" },
  { value: "critical", label: "Критический компонент" },
  { value: "communicative", label: "Коммуникативный компонент" },
];

export const QUIZ_DIFFICULTY_OPTIONS: { value: QuizFields["difficulty"]; label: string }[] = [
  { value: "mixed", label: "Смешанный (базовый + средний + продвинутый)" },
  { value: "easy", label: "Базовый" },
  { value: "medium", label: "Средний" },
  { value: "hard", label: "Продвинутый" },
];

export const QUIZ_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "single", label: "Выбор одного ответа" },
  { value: "multiple", label: "Выбор нескольких ответов" },
  { value: "matching", label: "Установление соответствия" },
  { value: "sequence", label: "Установление последовательности" },
];

export const COMPETENCY_OPTIONS: string[] = [
  "Применение современных средств поиска, анализа и интерпретации информации",
  "ИИ-грамотность",
  "ИКТ-грамотность",
  "Решение сложных и комплексных задач",
  "Работа в команде и распределение ролей в проекте",
  "Стратегическая коммуникация",
  "Мобильность, адаптивность и гибкость",
  "Применение знаний по правовой и финансовой грамотности в различных жизненных ситуациях",
  "Осуществление устной и письменной коммуникации на государственном языке",
  "Проявление гражданско-патриотической позиции, демонстрация осознанного поведения",
  "Применение знаний об изменении климата, принципы бережливого производства",
  "Укрепление здоровья в процессе профессиональной деятельности",
  "Оценка и самооценка собственной деятельности",
];

export async function requestGeneration(type: GeneratorType, fields: Record<string, string>): Promise<string> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generate", type, fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось сгенерировать материал");
  return data.content as string;
}

export async function requestRefine(content: string, instruction: string): Promise<string> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refine", content, instruction }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось доработать материал");
  return data.content as string;
}
