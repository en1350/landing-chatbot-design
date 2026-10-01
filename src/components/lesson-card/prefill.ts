import { TECHNOLOGIES } from "./lessonCardConfig";

const KEY = "urokai_lesson_card_prefill";

export interface LessonCardPrefill {
  discipline: string;
  group: string;
  topic: string;
  goal: string;
  duration: string;
  lessonType: string;
  competencies: string[];
  technologies: string[];
}

export function matchTechnologies(raw: string): string[] {
  const value = (raw || "").toLowerCase();
  if (!value.trim()) return [];
  return TECHNOLOGIES.filter((t) => value.includes(t.toLowerCase().slice(0, 8)));
}

export function saveLessonCardPrefill(data: LessonCardPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage недоступен — просто откроем пустой конструктор */
  }
}

export function takeLessonCardPrefill(): LessonCardPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as LessonCardPrefill;
  } catch {
    return null;
  }
}
