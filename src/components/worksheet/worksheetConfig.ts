export type WorksheetTaskType = "open" | "choice" | "table";

export interface WorksheetTask {
  id: number;
  title: string;
  type: WorksheetTaskType;
  description: string;
  options: string[];
  columns: string[];
  rows: number;
}

export interface WorksheetMeta {
  topic: string;
  group: string;
  teacher: string;
  planText: string;
}

export const TASK_TYPE_LABELS: Record<WorksheetTaskType, string> = {
  open: "Открытый ответ (строки)",
  choice: "Выбор ответа",
  table: "Таблица для заполнения",
};

export const LEVELS = ["лёгкий", "средний", "повышенный"];

export const REFINE_HINTS = [
  "Сделай задания сложнее",
  "Добавь практический пример",
  "Сократи формулировки",
  "Добавь задание с таблицей",
];

let counter = Date.now();
export const nextId = () => ++counter;

export const createTask = (patch: Partial<WorksheetTask> = {}): WorksheetTask => ({
  id: nextId(),
  title: "Новое задание",
  type: "open",
  description: "",
  options: ["", "", ""],
  columns: ["Показатель", "Ответ"],
  rows: 3,
  ...patch,
});

export const fromApi = (items: Partial<WorksheetTask>[]): WorksheetTask[] =>
  items.map((t) =>
    createTask({
      title: t.title || "Задание",
      type: (t.type as WorksheetTaskType) || "open",
      description: t.description || "",
      options: t.options && t.options.length ? t.options : ["", "", ""],
      columns: t.columns && t.columns.length ? t.columns : ["Показатель", "Ответ"],
      rows: t.rows || 3,
    })
  );
