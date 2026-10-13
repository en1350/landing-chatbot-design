export interface ProjectPlan {
  name: string;
  description: string;
  problem: { text: string; relevance: string; scale: string };
  audience: { segment: string; traits: string; needs: string; size: string }[];
  smart: { s: string; m: string; a: string; r: string; t: string };
  goal: string;
  tasks: { name: string; responsible: string; startWeek: number; endWeek: number; priority: string }[];
  stages: { name: string; result: string; period: string; responsible: string }[];
  milestones: { when: string; name: string; criterion: string }[];
  team: { role: string; duties: string; load: string }[];
  stakeholders: { name: string; type: string; interest: string; strategy: string }[];
  lifecycle: { phase: string; actions: string; results: string; period: string }[];
  assumptions: { text: string; basis: string }[];
  constraints: { type: string; description: string; impact: string; mitigation: string }[];
  risks: { risk: string; category: string; probability: number; impact: number; strategy: string; measures: string }[];
  kpi: { name: string; target: string; frequency: string }[];
  reporting: { type: string; frequency: string; content: string }[];
  changeProcedure: string;
}

export const PROJECT_TYPES = [
  "Учебный проект",
  "Исследовательский проект",
  "Социальный проект",
  "Внеурочное мероприятие",
  "Школьный / колледжный проект",
  "Бизнес-проект",
  "IT-проект",
];

export const riskLevel = (p: number, i: number) => {
  const v = p * i;
  if (v <= 4) return { label: "Низкий", cls: "bg-emerald-100 text-emerald-800" };
  if (v <= 9) return { label: "Средний", cls: "bg-amber-100 text-amber-800" };
  if (v <= 16) return { label: "Высокий", cls: "bg-red-100 text-red-800" };
  return { label: "Критический", cls: "bg-red-800 text-white" };
};

export const planToLines = (pl: ProjectPlan): string[] => {
  const L: string[] = [];
  const sec = (t: string) => L.push("", t.toUpperCase());
  L.push(pl.name, pl.description);
  sec("1. Проблема и аудитория");
  L.push(`Проблема: ${pl.problem.text}`, `Актуальность: ${pl.problem.relevance}`, `Масштаб: ${pl.problem.scale}`);
  pl.audience.forEach((a) => L.push(`- ${a.segment} (${a.traits}); потребности: ${a.needs}; оценка: ${a.size}`));
  sec("2. Цель проекта (SMART)");
  L.push(
    `Конкретность: ${pl.smart.s}`,
    `Измеримость: ${pl.smart.m}`,
    `Достижимость: ${pl.smart.a}`,
    `Значимость: ${pl.smart.r}`,
    `Срок: ${pl.smart.t}`,
    `Цель: ${pl.goal}`
  );
  sec("3. Задачи");
  pl.tasks.forEach((t, i) =>
    L.push(`${i + 1}. ${t.name} — ${t.responsible}; недели ${t.startWeek}-${t.endWeek}; приоритет: ${t.priority}`)
  );
  sec("4. Этапы и вехи");
  pl.stages.forEach((s, i) => L.push(`${i + 1}. ${s.name} — ${s.result}; ${s.period}; ${s.responsible}`));
  pl.milestones.forEach((m) => L.push(`Веха (${m.when}): ${m.name} — ${m.criterion}`));
  sec("5. Команда и заинтересованные стороны");
  pl.team.forEach((t) => L.push(`- ${t.role}: ${t.duties} (${t.load})`));
  pl.stakeholders.forEach((s) => L.push(`- ${s.name} (${s.type}): ${s.interest}; взаимодействие: ${s.strategy}`));
  sec("6. Жизненный цикл");
  pl.lifecycle.forEach((l) => L.push(`${l.phase}: ${l.actions}; результат: ${l.results}; ${l.period}`));
  sec("7. Условия и ограничения");
  pl.assumptions.forEach((a) => L.push(`Допущение: ${a.text} (${a.basis})`));
  pl.constraints.forEach((c) => L.push(`${c.type}: ${c.description}; влияние: ${c.impact}; смягчение: ${c.mitigation}`));
  sec("8. Риски");
  pl.risks.forEach((r, i) => {
    const lv = riskLevel(r.probability, r.impact).label;
    L.push(`R${i + 1}. ${r.risk} [${r.category}] вероятность ${r.probability}, влияние ${r.impact}, уровень: ${lv}; ${r.strategy}: ${r.measures}`);
  });
  sec("9. Контроль проекта");
  pl.kpi.forEach((k) => L.push(`KPI: ${k.name} — цель ${k.target}; ${k.frequency}`));
  pl.reporting.forEach((r) => L.push(`${r.type} (${r.frequency}): ${r.content}`));
  L.push(`Изменения: ${pl.changeProcedure}`);
  return L;
};
