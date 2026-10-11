export interface PmTaskItem {
  text: string;
  level: "basic" | "medium" | "high";
}

export interface PmCriterion {
  grade: string;
  criterion: string;
  match: string;
}

export const PM_TASK_TYPES: { value: string; label: string }[] = [
  { value: "practical", label: "Практическая работа" },
  { value: "lab", label: "Лабораторная работа" },
  { value: "control", label: "Контрольная работа" },
  { value: "situational", label: "Ситуационные задачи" },
  { value: "test", label: "Тестовые задания" },
  { value: "project", label: "Проектное задание" },
  { value: "complex", label: "Комплексное задание" },
];

export const PM_LEVELS: { value: string; label: string }[] = [
  { value: "basic", label: "Базовый (репродуктивный)" },
  { value: "medium", label: "Средний (конструктивный)" },
  { value: "high", label: "Высокий (творческий)" },
  { value: "mixed", label: "Смешанный" },
];

export const PM_CONTROL_FORMS = ["Дифференцированный зачёт", "Экзамен", "Текущий контроль", "Промежуточная аттестация"];

export const LEVEL_LABEL: Record<string, string> = { basic: "Базовый", medium: "Средний", high: "Высокий" };

export const LEVEL_CLASS: Record<string, string> = {
  basic: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-primary/15 text-primary",
};
