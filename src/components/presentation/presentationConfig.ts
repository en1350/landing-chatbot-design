export interface Slide {
  title: string;
  bullets: string[];
  notes: string;
  image: string;
}

export interface PresentationData {
  title: string;
  slides: Slide[];
}

export type StyleKey = "modern" | "creative" | "game" | "storyteller";

export interface StyleTheme {
  key: StyleKey;
  label: string;
  emoji: string;
  hint: string;
  bg: string;
  bgAlt: string;
  accent: string;
  text: string;
  muted: string;
  titleFont: string;
  bodyFont: string;
}

export const STYLES: StyleTheme[] = [
  {
    key: "modern",
    label: "Современный",
    emoji: "💼",
    hint: "Строгий, деловой, с чёткими тезисами",
    bg: "#FFFFFF",
    bgAlt: "#1E3A8A",
    accent: "#2563EB",
    text: "#0F172A",
    muted: "#64748B",
    titleFont: "Arial",
    bodyFont: "Arial",
  },
  {
    key: "creative",
    label: "Творческий",
    emoji: "🎨",
    hint: "Яркие цвета и образные формулировки",
    bg: "#FFF7ED",
    bgAlt: "#9D174D",
    accent: "#EA580C",
    text: "#431407",
    muted: "#9A3412",
    titleFont: "Georgia",
    bodyFont: "Arial",
  },
  {
    key: "game",
    label: "Игровой",
    emoji: "🎮",
    hint: "Интерактив, задания и элементы соревнования",
    bg: "#1E1B4B",
    bgAlt: "#4C1D95",
    accent: "#FACC15",
    text: "#FFFFFF",
    muted: "#C4B5FD",
    titleFont: "Verdana",
    bodyFont: "Verdana",
  },
  {
    key: "storyteller",
    label: "Визуальный рассказчик",
    emoji: "📖",
    hint: "Минимум текста, история и образы",
    bg: "#F5F1EA",
    bgAlt: "#1F2937",
    accent: "#B45309",
    text: "#1F2937",
    muted: "#6B7280",
    titleFont: "Georgia",
    bodyFont: "Georgia",
  },
];

export const SLIDE_COUNTS = [5, 8, 10, 12, 15, 20] as const;

export const SLIDE_W = 960;
export const SLIDE_H = 540;

export const getTheme = (key: string): StyleTheme => STYLES.find((s) => s.key === key) || STYLES[0];

export const isCover = (index: number) => index === 0;
export const isLast = (index: number, total: number) => index === total - 1 && total > 1;
