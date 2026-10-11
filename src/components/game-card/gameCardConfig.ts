export const GAME_TYPES = ["🎯 Квиз", "📊 Опрос", "🎭 Роли", "🏆 Викторина", "♟️ Стратегия"] as const;

export const GAME_TIMES = ["5 минут", "10 минут", "15 минут", "25 минут", "45 минут"] as const;

export const GAME_PEOPLE = ["1–5", "6–10", "11–20", "21–30", "30+"] as const;

export const GAME_GOALS = ["🔥 Вовлечение", "🧠 Обучение", "🔒 Закрепление", "💭 Рефлексия"] as const;

export interface GameStage {
  name: string;
  minutes: number;
  description: string;
}

export interface GameCardData {
  topic: string;
  gameType: string;
  time: string;
  people: string;
  goal: string;
  scenario: string;
  aiGoal: string;
  stages: GameStage[];
  rules: string;
  materials: string[];
  tips: string[];
  criteria: string;
}

export interface GameCardPrefill {
  topic: string;
  time: string;
  people: string;
}

const KEY = "urokai_game_card_prefill";

export function saveGameCardPrefill(data: GameCardPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage недоступен */
  }
}

export function takeGameCardPrefill(): GameCardPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as GameCardPrefill;
  } catch {
    return null;
  }
}

export function matchPeopleBucket(value: string): string | null {
  const num = parseInt((value || "").replace(/[^\d]/g, ""), 10);
  if (!num) return null;
  if (num <= 5) return "1–5";
  if (num <= 10) return "6–10";
  if (num <= 20) return "11–20";
  if (num <= 30) return "21–30";
  return "30+";
}
