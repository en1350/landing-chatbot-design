export interface KosIndicator {
  code: string;
  name: string;
}

export interface KosCompetency {
  code: string;
  name: string;
  indicators: KosIndicator[];
}

export interface KosTask {
  name: string;
  type: string;
  controlType: string;
  indicator: string;
  description: string;
  criteria?: string;
  source?: string;
}

export interface KosLevel {
  name: string;
  description: string;
  criteria: string;
}

export interface KosData {
  passport: Record<string, string>;
  competencies: KosCompetency[];
  tasks: KosTask[];
  levels: KosLevel[];
  control: { current: string; intermediate: string; final: string; selfStudy: string };
  scale: string;
  generalCriteria: string;
}

export const EMPTY_KOS: KosData = {
  passport: {},
  competencies: [],
  tasks: [],
  levels: [],
  control: { current: "", intermediate: "", final: "", selfStudy: "" },
  scale: "",
  generalCriteria: "",
};

export const KOS_TASK_TYPES = [
  "Практическое задание",
  "Лабораторная работа",
  "Тест",
  "Кейс-задача",
  "Курсовой проект",
  "Устный опрос",
  "Коллоквиум",
  "Демонстрационный экзамен",
  "Другое",
];

export const KOS_CONTROL_TYPES = ["Текущий", "Промежуточный", "Итоговый", "Демонстрационный экзамен"];

export const INTERMEDIATE_OPTIONS = ["Экзамен", "Зачёт", "Дифференцированный зачёт", "Курсовой проект", "Демонстрационный экзамен"];

export const PASSPORT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "direction", label: "Код и наименование специальности СПО", placeholder: "09.02.07 Информационные системы и программирование" },
  { key: "discipline", label: "Дисциплина / МДК", placeholder: "МДК.01.01 Разработка кода информационных систем" },
  { key: "credits", label: "Общая трудоёмкость", placeholder: "108 часов (в т.ч. 36 ч. аудиторных)" },
];

export const indicatorKey = (c: KosCompetency, i: KosIndicator) => `${c.code}.${i.code}`;

export const allIndicatorKeys = (competencies: KosCompetency[]) =>
  competencies.flatMap((c) => c.indicators.map((i) => ({ key: indicatorKey(c, i), comp: c, ind: i })));

export const buildKosText = (d: KosData): string => {
  const p = d.passport;
  const v = (x?: string) => (x && x.trim()) || "—";
  const lines: string[] = [
    `Дисциплина / МДК: ${v(p.discipline)}`,
    `Специальность СПО: ${v(p.direction)}`,
    `Форма промежуточной аттестации: ${v(p.intermediate)}`,
    `Общая трудоёмкость: ${v(p.credits)}`,
    "",
    "1. ПЕРЕЧЕНЬ КОМПЕТЕНЦИЙ",
  ];
  d.competencies.forEach((c) => {
    lines.push(`${c.code} — ${c.name}`);
    c.indicators.forEach((i) => lines.push(`   ${i.code}: ${i.name}`));
  });
  lines.push("", "2. ФОРМЫ КОНТРОЛЯ");
  lines.push(`Текущий контроль: ${v(d.control.current)}`);
  lines.push(`Промежуточный контроль: ${v(d.control.intermediate)}`);
  lines.push(`Итоговая аттестация: ${v(d.control.final)}`);
  lines.push(`Самостоятельная работа: ${v(d.control.selfStudy)}`);
  if (d.tasks.length) {
    lines.push("", "3. ОЦЕНОЧНЫЕ СРЕДСТВА");
    d.tasks.forEach((t, i) => {
      lines.push(`${i + 1}. ${t.name} (${t.type}; ${t.controlType}; ${t.indicator || "компетенция не выбрана"})`);
      if (t.description.trim()) lines.push(t.description.trim());
      if (t.criteria && t.criteria.trim()) lines.push("", "Критерии оценивания:", t.criteria.trim());
      lines.push("");
    });
  }
  if (d.levels.length) {
    lines.push("4. УРОВНИ СФОРМИРОВАННОСТИ КОМПЕТЕНЦИЙ");
    d.levels.forEach((l) => lines.push(`${l.name} (${l.description}): ${l.criteria}`));
    lines.push("");
  }
  if (d.scale.trim()) lines.push("5. ШКАЛА ОЦЕНИВАНИЯ", d.scale.trim(), "");
  if (d.generalCriteria.trim()) lines.push("6. ОБЩИЕ КРИТЕРИИ", d.generalCriteria.trim());
  return lines.join("\n");
};
