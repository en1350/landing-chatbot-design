export interface EventRow {
  id: string;
  year: string;
  date: string;
  subject: string;
  group: string;
  total: number;
  type: string;
  desc: string;
  participants: number;
}

export const YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export const ACTIVITY_TYPES = [
  "Проект",
  "Конкурс",
  "Кружок",
  "НСО",
  "Секция",
  "Курс",
  "Факультатив",
  "Мастер-класс",
  "Акция",
  "Конференция",
  "Просмотр и обсуждение видео",
  "Руководство курсовыми проектами",
  "Другое",
];

export const pct = (r: EventRow) => (r.total > 0 ? (r.participants / r.total) * 100 : 0);

export const levelOf = (p: number) => (p >= 75 ? "high" : p >= 40 ? "mid" : "low");

export const DEMO_ROWS: Omit<EventRow, "id">[] = [
  { year: "2024-2025", date: "2024-11-15", subject: "Реабилитация пациентов терапевтического профиля", group: "234", total: 24, type: "Просмотр и обсуждение видео", desc: "«Искусственный интеллект в медицине»", participants: 24 },
  { year: "2024-2025", date: "2024-11-15", subject: "Реабилитация пациентов терапевтического профиля", group: "235", total: 16, type: "Просмотр и обсуждение видео", desc: "«Искусственный интеллект в медицине»", participants: 16 },
  { year: "2024-2025", date: "2025-04-04", subject: "Основы реабилитации физиотерапии", group: "234", total: 24, type: "Мастер-класс", desc: "Мероприятие ко Дню здоровья", participants: 4 },
  { year: "2024-2025", date: "2025-04-30", subject: "Реабилитация пациентов терапевтического профиля", group: "220", total: 22, type: "Акция", desc: "Станция «Кабинет здорового ребёнка»", participants: 6 },
  { year: "2025-2026", date: "2025-11-12", subject: "Реабилитация пациентов терапевтического профиля", group: "132 б", total: 15, type: "Конкурс", desc: "Республиканский конкурс «Тифлотроеборье»", participants: 8 },
  { year: "2025-2026", date: "2025-12-10", subject: "Реабилитация пациентов терапевтического профиля", group: "130", total: 19, type: "Конференция", desc: "Конференция по итогам прохождения практики", participants: 19 },
  { year: "2025-2026", date: "2026-01-15", subject: "Хирургические заболевания, травмы и беременность", group: "430д", total: 25, type: "Просмотр и обсуждение видео", desc: "«Противоопухолевый иммунитет»", participants: 25 },
  { year: "2025-2026", date: "2026-04-07", subject: "Реабилитация пациентов терапевтического профиля", group: "224", total: 22, type: "Акция", desc: "«Пункт здоровья»", participants: 5 },
  { year: "2025-2026", date: "2026-03-23", subject: "Основы реабилитации", group: "240", total: 24, type: "Мастер-класс", desc: "«СЛР» для членов Сыктывкарской МО ВОС", participants: 2 },
];
