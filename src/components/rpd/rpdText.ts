import { RpdData, hoursTotal, ktpTotals } from "./rpdConfig";

export const RPD_TITLE = "Рабочая программа дисциплины";

const dash = (v: string) => v.trim() || "—";

export const rpdToText = (d: RpdData): string => {
  const ktp = d.ktp.filter((r) => r.topic.trim());
  const comps = d.competencies.filter((c) => c.code.trim() || c.text.trim());
  const t = ktpTotals(d.ktp);
  const lines: string[] = [
    `Дисциплина: ${dash(d.disciplineName)}`,
    `Код: ${dash(d.disciplineCode)}`,
    `ФГОС: ${dash(d.fgos)}`,
    `Направление подготовки: ${dash(d.direction)}`,
    `Образовательная программа: ${dash(d.programName)}`,
    `Профиль: ${dash(d.profile)}`,
    `Курс: ${dash(d.course)}, семестр: ${dash(d.semester)}`,
    `Общая трудоёмкость: ${d.totalHours || 0} ч. (${d.credits || 0} ЗЕ)`,
    `Промежуточная аттестация: ${dash(d.attestationType)}`,
    `Язык обучения: ${dash(d.language)}`,
    "",
    "1. ЦЕЛЬ ДИСЦИПЛИНЫ",
    dash(d.goal),
    "",
    "2. ЗАДАЧИ ДИСЦИПЛИНЫ",
    dash(d.tasks),
    "",
    "3. ПЛАНИРУЕМЫЕ РЕЗУЛЬТАТЫ ОБУЧЕНИЯ (КОМПЕТЕНЦИИ)",
    ...(comps.length ? comps.map((c) => `${c.code} — ${c.text}${c.tool ? ` (оценочное средство: ${c.tool})` : ""}`) : ["—"]),
    "",
    "4. МЕСТО ДИСЦИПЛИНЫ В СТРУКТУРЕ ОП",
    `Пререквизиты: ${dash(d.prereq)}`,
    `Постреквизиты: ${dash(d.postreq)}`,
    "",
    "5. СТРУКТУРА И СОДЕРЖАНИЕ ДИСЦИПЛИНЫ",
    dash(d.structure),
    "",
    "Объём дисциплины по видам учебной работы (часы):",
    `Лекции: ${d.hoursLecture || 0}`,
    `Практические занятия: ${d.hoursPractice || 0}`,
    `Лабораторные работы: ${d.hoursLab || 0}`,
    `Самостоятельная работа: ${d.hoursSelf || 0}`,
    `Контроль: ${d.hoursControl || 0}`,
    `ИТОГО: ${hoursTotal(d)}`,
    "",
    "6. КАЛЕНДАРНО-ТЕМАТИЧЕСКИЙ ПЛАН",
    ...(ktp.length
      ? [
          ...ktp.map(
            (r, i) =>
              `${i + 1}. ${r.topic} — всего ${r.total} ч. (лекции ${r.lect}, практ. ${r.pract}, лаб. ${r.lab}, СРС ${r.self})${r.control ? `, контроль: ${r.control}` : ""}`,
          ),
          `ИТОГО: ${t.total} ч. (лекции ${t.lect}, практ. ${t.pract}, лаб. ${t.lab}, СРС ${t.self})`,
        ]
      : ["—"]),
    "",
    "7. ОЦЕНОЧНЫЕ СРЕДСТВА",
    "Текущий контроль:",
    dash(d.currentControl),
    "Промежуточная аттестация:",
    dash(d.intermediateControl),
    "Критерии оценивания:",
    dash(d.criteria),
    "Типовые контрольные задания:",
    dash(d.sampleTasks),
    "Процедуры оценивания:",
    dash(d.evalMethods),
    "",
    "8. УЧЕБНО-МЕТОДИЧЕСКОЕ ОБЕСПЕЧЕНИЕ",
    "Основная литература:",
    dash(d.mainLit),
    "Дополнительная литература:",
    dash(d.addLit),
    "Электронные образовательные ресурсы:",
    dash(d.eResources),
    "Программное обеспечение:",
    dash(d.software),
    "Информационные справочные системы:",
    dash(d.infoSystems),
    "Материально-техническое обеспечение:",
    dash(d.materials),
    "",
    "9. РАЗРАБОТЧИК РПД",
    `${dash(d.developer)}, ${dash(d.developerPosition)}`,
    `${dash(d.organization)}, ${dash(d.department)}`,
    `Год утверждения: ${dash(d.approvalYear)}`,
  ];
  return lines.join("\n");
};
