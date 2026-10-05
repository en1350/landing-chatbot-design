export const EVENT_FORMATS = [
  "Мастер-класс",
  "Интенсив",
  "Воркшоп",
  "Тренинг",
  "Хакатон",
  "Проектная лаборатория",
] as const;

export const EVENT_AUDIENCES = ["Школьники", "Студенты", "Взрослые", "Пенсионеры"] as const;

export const EVENT_DURATIONS = ["10 минут", "20 минут", "45 минут", "3 часа", "1 день", "3 дня"] as const;

export const EVENT_LEVELS = ["Начальный", "Средний", "Продвинутый"] as const;

export const EVENT_MODES = ["Онлайн", "Офлайн", "Гибрид"] as const;

export interface ScenarioBlock {
  id: number;
  title: string;
  time: string;
  desc: string;
}

export interface EventPrefill {
  title: string;
  format: string;
  audience: string;
  duration: string;
  description: string;
}

export const DEFAULT_SCENARIO: Omit<ScenarioBlock, "id">[] = [
  { title: "Приветствие", time: "5 мин", desc: "Знакомство, ice-breaker, обозначение целей" },
  { title: "Основная часть", time: "25 мин", desc: "Теория, практика, групповая работа" },
  { title: "Переключение внимания", time: "5 мин", desc: "Физкультминутка, игра, энерджайзер" },
  { title: "Рефлексия", time: "10 мин", desc: "Подведение итогов, обратная связь, выводы" },
];

const KEY = "urokai_event_card_prefill";

const AUDIENCE_MAP: Record<string, string> = {
  schoolchildren: "Школьники",
  students: "Студенты",
  adults: "Взрослые",
};

const DURATION_MAP: Record<string, string> = {
  "15min": "20 минут",
  "30min": "45 минут",
  "45min": "45 минут",
  "90min": "3 часа",
  "1day": "1 день",
  "2days": "3 дня",
};

const FORMAT_MAP: Record<string, string> = {
  intensive: "Интенсив",
  masterclass: "Мастер-класс",
  workshop: "Воркшоп",
  hackathon: "Хакатон",
  project_lab: "Проектная лаборатория",
  immersive: "Интенсив",
};

export const mapIntensiveToEvent = (f: {
  topic: string;
  audience: string;
  duration: string;
  format: string;
  goal: string;
}): EventPrefill => ({
  title: f.topic,
  format: FORMAT_MAP[f.format] || "Мастер-класс",
  audience: AUDIENCE_MAP[f.audience] || "Школьники",
  duration: DURATION_MAP[f.duration] || "45 минут",
  description: f.goal,
});

export function saveEventPrefill(data: EventPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage недоступен */
  }
}

export function takeEventPrefill(): EventPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as EventPrefill;
  } catch {
    return null;
  }
}
