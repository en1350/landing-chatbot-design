export const TIME_OPTIONS = ["10 минут", "15 минут", "25 минут", "40 минут"] as const;

export const TASK_TYPES = [
  "Репродуктивное",
  "Проблемное",
  "Проектное",
  "Творческое",
  "Кейс",
] as const;

export type TaskTypeOption = (typeof TASK_TYPES)[number];

export interface TaskCardPrefill {
  discipline: string;
  group: string;
  topic: string;
  goal: string;
  taskType: string;
  competencies: string[];
}

const KEY = "urokai_task_card_prefill";

export function saveTaskCardPrefill(data: TaskCardPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage недоступен */
  }
}

export function takeTaskCardPrefill(): TaskCardPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as TaskCardPrefill;
  } catch {
    return null;
  }
}

export const COMPONENT_TO_TASK_TYPE: Record<string, string> = {
  cognitive: "Репродуктивное",
  creative: "Творческое",
  critical: "Проблемное",
  communicative: "Проектное",
  balanced: "Репродуктивное",
};
