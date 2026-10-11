export const GAME_TYPES = ["🎯 Квиз", "📊 Опрос", "🎭 Роли", "🏆 Викторина", "♟️ Стратегия"] as const;

export const GAME_TIMES = ["5 минут", "10 минут", "25 минут"] as const;

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
