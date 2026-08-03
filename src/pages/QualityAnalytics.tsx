import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";

/* ---------- Типы и утилиты ---------- */

type LevelInfo = { name: string; cls: string; priority: "low" | "medium" | "high"; color: string };

function getLevelByAvg(a: number): LevelInfo {
  if (a >= 4.5) return { name: "Высокий", cls: "bg-emerald-500", priority: "low", color: "#27ae60" };
  if (a >= 3.5) return { name: "Достаточный", cls: "bg-sky-500", priority: "low", color: "#3498db" };
  if (a >= 2.5) return { name: "Средний", cls: "bg-amber-500", priority: "medium", color: "#f39c12" };
  return { name: "Низкий", cls: "bg-red-500", priority: "high", color: "#e74c3c" };
}

function getBarGradient(a: number) {
  if (a >= 4.5) return "linear-gradient(90deg, #27ae60, #229954)";
  if (a >= 3.5) return "linear-gradient(90deg, #3498db, #2980b9)";
  if (a >= 2.5) return "linear-gradient(90deg, #f39c12, #e67e22)";
  return "linear-gradient(90deg, #e74c3c, #c0392b)";
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function parseList(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
}

function getMeasuresForSkill(skillName: string, avgGrade: number): string[] {
  const lower = skillName.toLowerCase();
  const measures: string[] = [];

  if (lower.includes("знани") || lower.includes("поняти") || lower.includes("категори")) {
    measures.push(
      "Обзорные лекции с визуализацией ключевых понятий",
      "Составление глоссария, ментальных карт, опорных конспектов",
      "Фронтальный опрос, блиц-контроль по основным терминам",
      "Интерактивные тренажёры и тестовые задания"
    );
  } else if (lower.includes("примен") || lower.includes("практик")) {
    measures.push(
      "Решение ситуационных задач и кейсов",
      "Выполнение лабораторных и практических работ",
      "Моделирование профессиональных ситуаций",
      "Разбор образцов применения теории на практике"
    );
  } else if (lower.includes("анализ")) {
    measures.push(
      "Обучение алгоритмам анализа через пошаговые инструкции",
      "Сравнительный анализ объектов, явлений, процессов",
      "Разбор конкретных примеров с самостоятельной работой",
      "Метод «мышление по критериям»"
    );
  } else if (lower.includes("проектир") || lower.includes("разработ")) {
    measures.push(
      "Изучение образцов проектов, разбор их структуры",
      "Поэтапное проектирование с промежуточным контролем",
      "Работа в малых группах над коллективным проектом",
      "Использование шаблонов и конструкторов проектов"
    );
  } else if (lower.includes("исследов") || lower.includes("научн")) {
    measures.push(
      "Освоение методов научного поиска и работы с источниками",
      "Выполнение мини-исследований под руководством преподавателя",
      "Участие в научно-исследовательских проектах кафедры",
      "Оформление результатов по стандартам научной работы"
    );
  } else {
    measures.push(
      "Дополнительные практические занятия по теме",
      "Индивидуальные консультации",
      "Выполнение дифференцированных заданий",
      "Самоподготовка по рекомендованным источникам"
    );
  }

  if (avgGrade < 2.5) {
    measures.unshift("Приоритет: высокий. Требуется повторное изучение темы");
  }
  return measures;
}

const DEMO_SKILLS = [
  "Знание основных понятий и категорий",
  "Применение теоретических положений на практике",
  "Анализ педагогических ситуаций",
  "Проектирование учебного занятия",
  "Научно-исследовательские умения",
];

const DEMO_STUDENTS = [
  "Иванов А. П.",
  "Петрова М. С.",
  "Сидоров В. И.",
  "Кузнецова Е. А.",
  "Смирнов Д. Н.",
  "Волкова О. В.",
  "Морозов И. К.",
  "Новикова Т. П.",
];

const DEMO_GRADES = [
  [5, 4, 5, 4, 4],
  [4, 4, 4, 3, 4],
  [3, 3, 2, 2, 3],
  [4, 4, 4, 4, 3],
  [3, 2, 3, 3, 2],
  [5, 5, 4, 5, 4],
  [3, 3, 3, 2, 3],
  [4, 3, 3, 3, 3],
];

/* ---------- Инструмент ---------- */

const QualityAnalyticsTool = () => {
  const [discipline, setDiscipline] = useState("Педагогика. Раздел: Теория обучения");
  const [group, setGroup] = useState("Пед-21, 2 курс");
  const [skillsText, setSkillsText] = useState(DEMO_SKILLS.join("\n"));
  const [studentsText, setStudentsText] = useState(DEMO_STUDENTS.join("\n"));

  const [skills, setSkills] = useState<string[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [grades, setGrades] = useState<number[][]>([]);

  const [tab, setTab] = useState("input");
  const [selectedStudent, setSelectedStudent] = useState(0);

  const initialized = skills.length > 0 && students.length > 0;

  const applyData = () => {
    const s = parseList(skillsText);
    const st = parseList(studentsText);
    if (s.length === 0 || st.length === 0) {
      alert("Укажите навыки и список студентов");
      return;
    }
    setSkills(s);
    setStudents(st);
    setGrades(st.map(() => s.map(() => 3)));
    setTab("grades");
  };

  const loadDemo = () => {
    setDiscipline("Педагогика. Раздел: Теория обучения");
    setGroup("Пед-21, 2 курс");
    setSkillsText(DEMO_SKILLS.join("\n"));
    setStudentsText(DEMO_STUDENTS.join("\n"));
    setSkills(DEMO_SKILLS);
    setStudents(DEMO_STUDENTS);
    setGrades(DEMO_GRADES.map((row) => [...row]));
    setTab("grades");
  };

  const clearAll = () => {
    if (!confirm("Очистить все данные?")) return;
    setDiscipline("");
    setGroup("");
    setSkillsText("");
    setStudentsText("");
    setSkills([]);
    setStudents([]);
    setGrades([]);
    setTab("input");
  };

  const setGrade = (studentIdx: number, skillIdx: number, value: number) => {
    setGrades((g) => {
      const next = g.map((row) => [...row]);
      next[studentIdx][skillIdx] = value;
      return next;
    });
  };

  const skillAvgs = skills.map((_, k) => avg(grades.map((g) => g[k])));
  const studentAvgs = students.map((_, i) => avg(grades[i] || []));
  const groupAvg = avg(studentAvgs);
  const groupLevel = getLevelByAvg(groupAvg);
  const counts = { high: 0, sufficient: 0, medium: 0, low: 0 };
  studentAvgs.forEach((a) => {
    const l = getLevelByAvg(a);
    if (l.name === "Высокий") counts.high++;
    else if (l.name === "Достаточный") counts.sufficient++;
    else if (l.name === "Средний") counts.medium++;
    else counts.low++;
  });
  const quality = students.length ? Math.round(((counts.high + counts.sufficient) / students.length) * 100) : 0;

  const groupDeficits = skills
    .map((s, k) => ({ name: s, avg: skillAvgs[k], level: getLevelByAvg(skillAvgs[k]) }))
    .filter((x) => x.level.priority !== "low")
    .sort((a, b) => a.avg - b.avg);

  const riskStudents = students
    .map((name, i) => ({
      name,
      idx: i,
      avg: studentAvgs[i],
      level: getLevelByAvg(studentAvgs[i]),
      deficits: skills.map((s, k) => ({ name: s, grade: grades[i]?.[k] ?? 0 })).filter((x) => x.grade < 4),
    }))
    .filter((s) => s.level.priority !== "low");

  const excellentStudents = students
    .map((name, i) => ({ name, avg: studentAvgs[i], level: getLevelByAvg(studentAvgs[i]) }))
    .filter((s) => s.level.priority === "low");

  const downloadHTMLReport = () => {
    if (students.length === 0) return;
    let html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>Отчёт: ${discipline}</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; color: #2c3e50; }
h1 { color: #1e3c72; border-bottom: 3px solid #2a5298; padding-bottom: 10px; }
h2 { color: #1e3c72; margin-top: 30px; border-bottom: 2px solid #e0e6ef; padding-bottom: 6px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
th { background: #f4f7fb; color: #1e3c72; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 10px; color: #fff; font-size: 11px; font-weight: 600; }
.b-high { background: #27ae60; } .b-suff { background: #3498db; } .b-med { background: #f39c12; } .b-low { background: #e74c3c; }
.info { background: #f4f7fb; padding: 14px; border-radius: 8px; margin: 12px 0; }
.plan-item { background: #fafbfd; padding: 12px; margin: 8px 0; border-left: 4px solid #2a5298; border-radius: 4px; }
.plan-item.high { border-left-color: #e74c3c; }
.plan-item.med { border-left-color: #f39c12; }
ul { margin-left: 20px; line-height: 1.7; }
</style></head><body>
<h1>Отчёт по уровневой аналитике качества освоения предметных умений</h1>
<div class="info">
<strong>Дисциплина:</strong> ${discipline}<br>
<strong>Группа:</strong> ${group}<br>
<strong>Дата:</strong> ${new Date().toLocaleDateString("ru-RU")}<br>
<strong>Количество студентов:</strong> ${students.length}<br>
<strong>Количество навыков:</strong> ${skills.length}
</div>
<h2>1. Сводные показатели по группе</h2>
<table>
<tr><th>Показатель</th><th>Значение</th></tr>
<tr><td>Средний балл группы</td><td><strong>${groupAvg.toFixed(2)}</strong> из 5</td></tr>
<tr><td>Уровень освоения группы</td><td>${groupLevel.name}</td></tr>
<tr><td>Качественная успеваемость (4 и 5)</td><td><strong>${quality}%</strong></td></tr>
<tr><td>Высокий уровень</td><td>${counts.high} студ.</td></tr>
<tr><td>Достаточный уровень</td><td>${counts.sufficient} студ.</td></tr>
<tr><td>Средний уровень</td><td>${counts.medium} студ.</td></tr>
<tr><td>Низкий уровень</td><td>${counts.low} студ.</td></tr>
</table>
<h2>2. Освоение навыков группой</h2>
<table><tr><th>Навык</th><th>Ср. балл</th><th>% освоения</th><th>Уровень</th></tr>
${skills.map((skill, k) => {
  const a = skillAvgs[k];
  const l = getLevelByAvg(a);
  const percent = Math.round((a / 5) * 100);
  return `<tr><td>${skill}</td><td>${a.toFixed(2)}</td><td>${percent}%</td><td>${l.name}</td></tr>`;
}).join("")}
</table>
<h2>3. Индивидуальные результаты студентов</h2>
<table><tr><th>№</th><th>ФИО</th>${skills.map((s) => `<th>${s}</th>`).join("")}<th>Ср. балл</th><th>Уровень</th></tr>
${students.map((st, i) => {
  const a = studentAvgs[i];
  const l = getLevelByAvg(a);
  return `<tr><td>${i + 1}</td><td><strong>${st}</strong></td>${grades[i].map((g) => `<td>${g}</td>`).join("")}<td><strong>${a.toFixed(2)}</strong></td><td>${l.name}</td></tr>`;
}).join("")}
</table>
<h2>4. План коррекционной работы</h2>
<h3>I. Групповая работа</h3>
${groupDeficits.length === 0 ? "<p>Все навыки освоены на достаточном уровне</p>" : groupDeficits.map((def) => {
  const m = getMeasuresForSkill(def.name, def.avg);
  const cls = def.level.priority === "high" ? "high" : "med";
  return `<div class="plan-item ${cls}"><strong>${def.name}</strong> (${def.level.name}, ср. ${def.avg.toFixed(2)})<ul>${m.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}).join("")}
<h3>II. Индивидуальная работа</h3>
${riskStudents.length === 0 ? "<p>Студентов группы риска не выявлено</p>" : riskStudents.map((st) => {
  const cls = st.level.priority === "high" ? "high" : "med";
  const defNames = st.deficits.map((d) => `${d.name} (${d.grade})`).join("; ");
  return `<div class="plan-item ${cls}"><strong>${st.name}</strong> (${st.level.name}, ср. ${st.avg.toFixed(2)})<ul><li>Дефицитные навыки: ${defNames || "—"}</li><li>Индивидуальная консультация</li><li>Дифференцированные задания</li><li>Промежуточный контроль через 2 недели</li></ul></div>`;
}).join("")}
<h3>III. Организационно-методические мероприятия</h3>
<div class="plan-item"><ul>
<li>Анализ результатов на методической комиссии</li>
<li>Корректировка рабочей программы дисциплины</li>
<li>Дополнительные практические занятия по дефицитным темам</li>
<li>Повторная диагностика через 4–6 недель</li>
</ul></div>
<p style="margin-top:40px; text-align:right; color:#7a8699; font-size:12px;">
Отчёт сформирован автоматически. Преподаватель: _________________ / _________________
</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Отчёт_${discipline.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (students.length === 0) return;
    let csv = "Дисциплина:;" + discipline + "\n";
    csv += "Группа:;" + group + "\n";
    csv += "Дата:;" + new Date().toLocaleDateString("ru-RU") + "\n\n";
    csv += "№;ФИО студента;" + skills.join(";") + ";Средний балл;Уровень\n";
    students.forEach((st, i) => {
      const a = avg(grades[i]);
      const l = getLevelByAvg(a);
      csv += `${i + 1};${st};${grades[i].join(";")};${a.toFixed(2)};${l.name}\n`;
    });
    csv += "\nСредний балл по навыку;;" + skills.map((_, k) => avg(grades.map((g) => g[k])).toFixed(2)).join(";") + "\n";

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Оценки_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (students.length === 0) return;
    const data = { discipline, group, skills, students, grades };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Данные_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto w-full gap-1 p-1">
          <TabsTrigger value="input" className="text-xs py-2">① Данные</TabsTrigger>
          <TabsTrigger value="grades" disabled={!initialized} className="text-xs py-2">② Оценки</TabsTrigger>
          <TabsTrigger value="group" disabled={!initialized} className="text-xs py-2">③ Группа</TabsTrigger>
          <TabsTrigger value="students" disabled={!initialized} className="text-xs py-2">④ Студенты</TabsTrigger>
          <TabsTrigger value="plan" disabled={!initialized} className="text-xs py-2">⑤ План</TabsTrigger>
          <TabsTrigger value="export" disabled={!initialized} className="text-xs py-2">⑥ Экспорт</TabsTrigger>
        </TabsList>

        {/* ВКЛАДКА 1: ДАННЫЕ */}
        <TabsContent value="input" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Заполните данные о дисциплине, навыках и студентах. Оценки выставляются по 5-балльной шкале.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Дисциплина / модуль</label>
              <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Группа / курс</label>
              <Input value={group} onChange={(e) => setGroup(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Предметные умения / навыки (по одному на строке)</label>
              <Textarea rows={6} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Список студентов (по одному на строке)</label>
              <Textarea rows={6} value={studentsText} onChange={(e) => setStudentsText(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" onClick={applyData}>
              <Icon name="Check" size={16} />
              Применить и перейти к оценкам
            </Button>
            <Button variant="outline" className="gap-2" onClick={loadDemo}>
              <Icon name="ClipboardList" size={16} />
              Загрузить демо-данные
            </Button>
            <Button variant="destructive" className="gap-2" onClick={clearAll}>
              <Icon name="Trash2" size={16} />
              Очистить всё
            </Button>
          </div>
        </TabsContent>

        {/* ВКЛАДКА 2: ОЦЕНКИ */}
        <TabsContent value="grades" className="mt-6 space-y-4">
          {!initialized ? (
            <p className="text-sm text-muted-foreground text-center py-10">Сначала заполните исходные данные</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Выберите оценку от 2 до 5 для каждого студента по каждому навыку. Итоги рассчитываются автоматически.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/60">
                      <th className="p-2 text-left">№</th>
                      <th className="p-2 text-left">ФИО студента</th>
                      {skills.map((s) => (
                        <th key={s} className="p-2 text-left min-w-[140px]">{s}</th>
                      ))}
                      <th className="p-2 text-left">Ср. балл</th>
                      <th className="p-2 text-left">Уровень</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st, i) => {
                      const studentAvg = avg(grades[i] || []);
                      const level = getLevelByAvg(studentAvg);
                      return (
                        <tr key={st} className="border-t border-border">
                          <td className="p-2">{i + 1}</td>
                          <td className="p-2 font-semibold whitespace-nowrap">{st}</td>
                          {skills.map((_, k) => (
                            <td key={k} className="p-2">
                              <select
                                value={grades[i]?.[k] ?? 3}
                                onChange={(e) => setGrade(i, k, Number(e.target.value))}
                                className="w-16 text-center font-semibold rounded-md border border-border py-1 cursor-pointer bg-background"
                              >
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                              </select>
                            </td>
                          ))}
                          <td className="p-2 font-bold">{studentAvg.toFixed(2)}</td>
                          <td className="p-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${level.cls}`}>
                              {level.name}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Button className="gap-2" onClick={() => setTab("group")}>
                <Icon name="BarChart3" size={16} />
                Сформировать аналитику
              </Button>
            </>
          )}
        </TabsContent>

        {/* ВКЛАДКА 3: ГРУППА */}
        <TabsContent value="group" className="mt-6 space-y-5">
          {!initialized ? (
            <p className="text-sm text-muted-foreground text-center py-10">Сначала заполните оценки</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-[#1e3c72] to-[#2a5298]">
                  <p className="text-xs opacity-90 mb-1">Средний балл группы</p>
                  <p className="font-display text-2xl font-bold">{groupAvg.toFixed(2)}</p>
                  <p className="text-[11px] opacity-80 mt-1">из 5 возможных</p>
                </div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-sky-500 to-sky-700">
                  <p className="text-xs opacity-90 mb-1">Качественная успеваемость</p>
                  <p className="font-display text-2xl font-bold">{quality}%</p>
                  <p className="text-[11px] opacity-80 mt-1">оценки 4 и 5</p>
                </div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-emerald-500 to-emerald-700">
                  <p className="text-xs opacity-90 mb-1">Высокий уровень</p>
                  <p className="font-display text-2xl font-bold">{counts.high}</p>
                  <p className="text-[11px] opacity-80 mt-1">студентов</p>
                </div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-amber-500 to-orange-600">
                  <p className="text-xs opacity-90 mb-1">Средний уровень</p>
                  <p className="font-display text-2xl font-bold">{counts.medium}</p>
                  <p className="text-[11px] opacity-80 mt-1">студентов</p>
                </div>
                <div className="rounded-xl p-4 text-white bg-gradient-to-br from-red-500 to-red-700">
                  <p className="text-xs opacity-90 mb-1">Низкий уровень</p>
                  <p className="font-display text-2xl font-bold">{counts.low}</p>
                  <p className="text-[11px] opacity-80 mt-1">группа риска</p>
                </div>
              </div>

              <h3 className="font-display font-bold text-base mt-4">Освоение навыков группой</h3>
              <div className="space-y-3">
                {skills.map((skill, k) => {
                  const a = skillAvgs[k];
                  const level = getLevelByAvg(a);
                  const percent = Math.round((a / 5) * 100);
                  return (
                    <div key={skill}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{skill}</span>
                        <span className="text-muted-foreground">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${level.cls} mr-1.5`}>
                            {level.name}
                          </span>
                          ср. балл {a.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center justify-end px-2 text-white text-[11px] font-semibold transition-all"
                          style={{ width: `${percent}%`, background: getBarGradient(a) }}
                        >
                          {percent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-display font-bold text-base mt-4">Сводная таблица по навыкам</h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/60">
                      <th className="p-2 text-left">Навык</th>
                      <th className="p-2 text-left">Ср. балл</th>
                      <th className="p-2 text-left">% освоения</th>
                      <th className="p-2 text-left">Уровень</th>
                      <th className="p-2 text-left">Кол-во «2»</th>
                      <th className="p-2 text-left">Кол-во «5»</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill, k) => {
                      const a = skillAvgs[k];
                      const level = getLevelByAvg(a);
                      const percent = Math.round((a / 5) * 100);
                      const twos = grades.filter((g) => g[k] === 2).length;
                      const fives = grades.filter((g) => g[k] === 5).length;
                      return (
                        <tr key={skill} className="border-t border-border">
                          <td className="p-2">{skill}</td>
                          <td className="p-2 font-bold">{a.toFixed(2)}</td>
                          <td className="p-2">{percent}%</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${level.cls}`}>
                              {level.name}
                            </span>
                          </td>
                          <td className="p-2">{twos}</td>
                          <td className="p-2">{fives}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* ВКЛАДКА 4: СТУДЕНТЫ */}
        <TabsContent value="students" className="mt-6 space-y-5">
          {!initialized ? (
            <p className="text-sm text-muted-foreground text-center py-10">Сначала заполните оценки</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {students.map((st, i) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStudent(i)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium border-2 transition-colors ${
                      selectedStudent === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-transparent hover:border-primary/30"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {(() => {
                const idx = selectedStudent;
                const studentGrades = grades[idx] || [];
                const studentAvg = avg(studentGrades);
                const level = getLevelByAvg(studentAvg);
                const deficits = skills.map((s, k) => ({ name: s, grade: studentGrades[k] })).filter((x) => x.grade < 4);
                const strengths = skills.map((s, k) => ({ name: s, grade: studentGrades[k] })).filter((x) => x.grade >= 4);

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl p-4 text-white bg-gradient-to-br from-[#1e3c72] to-[#2a5298]">
                        <p className="text-xs opacity-90 mb-1">Студент</p>
                        <p className="font-display text-base font-bold">{students[idx]}</p>
                        <p className="text-[11px] opacity-80 mt-1">{discipline}</p>
                      </div>
                      <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${level.color}, ${level.color}dd)` }}>
                        <p className="text-xs opacity-90 mb-1">Уровень освоения</p>
                        <p className="font-display text-xl font-bold">{level.name}</p>
                        <p className="text-[11px] opacity-80 mt-1">ср. балл {studentAvg.toFixed(2)} из 5</p>
                      </div>
                      <div className="rounded-xl p-4 text-white bg-gradient-to-br from-sky-500 to-sky-700">
                        <p className="text-xs opacity-90 mb-1">Освоено навыков</p>
                        <p className="font-display text-2xl font-bold">{strengths.length}/{skills.length}</p>
                        <p className="text-[11px] opacity-80 mt-1">с оценкой 4 или 5</p>
                      </div>
                      <div className="rounded-xl p-4 text-white bg-gradient-to-br from-red-500 to-red-700">
                        <p className="text-xs opacity-90 mb-1">Дефицитных навыков</p>
                        <p className="font-display text-2xl font-bold">{deficits.length}</p>
                        <p className="text-[11px] opacity-80 mt-1">требуют коррекции</p>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base mt-4">Оценки по навыкам</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/60">
                            <th className="p-2 text-left">Навык</th>
                            <th className="p-2 text-left">Оценка</th>
                            <th className="p-2 text-left">Уровень</th>
                            <th className="p-2 text-left">Комментарий</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skills.map((skill, k) => {
                            const g = studentGrades[k];
                            const l = getLevelByAvg(g);
                            let comment = "";
                            if (g === 5) comment = "Отличное владение навыком";
                            else if (g === 4) comment = "Хорошее владение, возможны незначительные неточности";
                            else if (g === 3) comment = "Базовое владение, требуется доработка";
                            else comment = "Навык не освоен, необходима срочная коррекция";
                            return (
                              <tr key={skill} className="border-t border-border">
                                <td className="p-2">{skill}</td>
                                <td className="p-2 font-bold">{g}</td>
                                <td className="p-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${l.cls}`}>
                                    {l.name}
                                  </span>
                                </td>
                                <td className="p-2 text-muted-foreground text-xs">{comment}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {deficits.length > 0 && (
                      <div className="rounded-xl border-l-4 border-red-500 bg-red-500/5 p-4">
                        <h4 className="font-display font-bold text-sm mb-2">🔴 Дефицитные навыки (требуют коррекции)</h4>
                        <ul className="space-y-1 text-sm list-disc pl-5">
                          {deficits.map((d) => (
                            <li key={d.name}><strong>{d.name}</strong> — оценка {d.grade}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {strengths.length > 0 && (
                      <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 p-4">
                        <h4 className="font-display font-bold text-sm mb-2">🟢 Сильные стороны</h4>
                        <ul className="space-y-1 text-sm list-disc pl-5">
                          {strengths.map((d) => (
                            <li key={d.name}><strong>{d.name}</strong> — оценка {d.grade}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>

        {/* ВКЛАДКА 5: ПЛАН */}
        <TabsContent value="plan" className="mt-6 space-y-4">
          {!initialized ? (
            <p className="text-sm text-muted-foreground text-center py-10">Сначала заполните оценки</p>
          ) : (
            <>
              <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
                <p><strong>Дисциплина:</strong> {discipline}</p>
                <p><strong>Группа:</strong> {group}</p>
                <p><strong>Дата формирования плана:</strong> {new Date().toLocaleDateString("ru-RU")}</p>
                <p><strong>Цель:</strong> ликвидация выявленных дефицитов предметных умений и повышение качества освоения программы.</p>
              </div>

              <div className="rounded-xl bg-secondary/30 p-4">
                <h3 className="font-display font-bold text-base mb-1">🎯 I. Групповая коррекционная работа</h3>
                <p className="text-xs text-muted-foreground mb-3">Мероприятия для всей группы по дефицитным навыкам</p>
                {groupDeficits.length === 0 ? (
                  <p className="text-sm text-emerald-600">✓ Все навыки освоены группой на достаточном уровне</p>
                ) : (
                  <div className="space-y-2">
                    {groupDeficits.map((def) => {
                      const measures = getMeasuresForSkill(def.name, def.avg);
                      const borderColor = def.level.priority === "high" ? "border-red-500" : "border-amber-500";
                      return (
                        <div key={def.name} className={`bg-card rounded-lg border-l-4 ${borderColor} p-3.5 border border-border`}>
                          <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2 flex-wrap">
                            {def.name}
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${def.level.cls}`}>
                              {def.level.name} (ср. {def.avg.toFixed(2)})
                            </span>
                          </h4>
                          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                            {measures.map((m) => <li key={m}>{m}</li>)}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-secondary/30 p-4">
                <h3 className="font-display font-bold text-base mb-1">👥 II. Индивидуальная работа со студентами группы риска</h3>
                <p className="text-xs text-muted-foreground mb-3">Персональные мероприятия для студентов со средним баллом ниже 3.5</p>
                {riskStudents.length === 0 ? (
                  <p className="text-sm text-emerald-600">✓ Студентов группы риска не выявлено</p>
                ) : (
                  <div className="space-y-2">
                    {riskStudents.map((st) => {
                      const borderColor = st.level.priority === "high" ? "border-red-500" : "border-amber-500";
                      const deficitNames = st.deficits.map((d) => `${d.name} (${d.grade})`).join("; ");
                      return (
                        <div key={st.name} className={`bg-card rounded-lg border-l-4 ${borderColor} p-3.5 border border-border`}>
                          <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2 flex-wrap">
                            {st.name}
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${st.level.cls}`}>
                              {st.level.name} (ср. {st.avg.toFixed(2)})
                            </span>
                          </h4>
                          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                            <li>Индивидуальная консультация по дефицитным навыкам: <em>{deficitNames || "—"}</em></li>
                            <li>Разработка индивидуальной траектории с дополнительными источниками</li>
                            <li>Выполнение дифференцированных заданий</li>
                            <li>Промежуточный контроль через 2 недели, итоговый — через месяц</li>
                            {st.level.priority === "high" && <li><strong>Обязательно:</strong> привлечение куратора/тьютора, встреча с родителями (при необходимости)</li>}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-secondary/30 p-4">
                <h3 className="font-display font-bold text-base mb-2">⭐ III. Работа со студентами высокого уровня</h3>
                {excellentStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Студентов с высоким уровнем не выявлено</p>
                ) : (
                  <div className="bg-card rounded-lg border-l-4 border-sky-500 p-3.5 border border-border">
                    <h4 className="text-sm font-semibold mb-1.5">Студенты: {excellentStudents.map((s) => s.name).join(", ")}</h4>
                    <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                      <li>Задания опережающего и исследовательского характера</li>
                      <li>Подготовка докладов на студенческих конференциях</li>
                      <li>Включение в роли тьюторов-наставников для студентов группы риска</li>
                      <li>Участие в олимпиадах и конкурсах профессионального мастерства</li>
                      <li>Рекомендации к публикации научных работ</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-secondary/30 p-4">
                <h3 className="font-display font-bold text-base mb-2">🗓 IV. Организационно-методические мероприятия</h3>
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                  <li>Обсудить результаты диагностики на заседании методической комиссии</li>
                  <li>Скорректировать рабочую программу дисциплины с учётом выявленных проблем</li>
                  <li>Включить в КРС дополнительные практические занятия по дефицитным темам</li>
                  <li>Обновить фонд оценочных средств</li>
                  <li>Повторная диагностика — через 4–6 недель</li>
                  <li>Ответственный: преподаватель дисциплины. Срок: до конца семестра</li>
                </ul>
              </div>
            </>
          )}
        </TabsContent>

        {/* ВКЛАДКА 6: ЭКСПОРТ */}
        <TabsContent value="export" className="mt-6 space-y-4">
          {!initialized ? (
            <p className="text-sm text-muted-foreground text-center py-10">Сначала заполните оценки</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Выберите формат экспорта. HTML-отчёт можно открыть в браузере и сохранить в PDF через печать.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button className="gap-2" onClick={downloadHTMLReport}>
                  <Icon name="FileText" size={16} />
                  Скачать HTML-отчёт
                </Button>
                <Button variant="secondary" className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600" onClick={downloadCSV}>
                  <Icon name="Table" size={16} />
                  Скачать оценки (CSV)
                </Button>
                <Button variant="secondary" className="gap-2 bg-amber-500 text-white hover:bg-amber-600" onClick={downloadJSON}>
                  <Icon name="Database" size={16} />
                  Скачать данные (JSON)
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Icon name="Printer" size={16} />
                  Печать / PDF
                </Button>
              </div>
              <div className="rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground">
                <strong>Подсказка:</strong> После скачивания HTML-отчёта откройте его в браузере и нажмите Ctrl+P (Cmd+P) для сохранения в PDF.
                CSV-файл открывается в Excel, Google Sheets или LibreOffice Calc.
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ---------- Страница с paywall ---------- */

const QualityAnalytics = () => {
  const { user, isPaid } = useAuth();
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
  };

  const openUpgrade = () => {
    setDecomposerOpen(false);
    setAntiplagiatOpen(false);
    setUpgradeOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={openAuth}
        onOpenPricing={() => (window.location.href = "/#pricing")}
      />

      <main className="flex-1">
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
              <span className="text-3xl">📊</span> Аналитическая справка качества обученности
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Уровневая аналитика качества освоения предметных умений: диагностика по 5-балльной шкале,
              анализ по группе и по студентам, автоматический план коррекционной работы и экспорт отчёта.
            </p>
          </div>

          {!isPaid ? (
            <div className="max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
                🔒
              </div>
              <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">
                Аналитическая справка качества обученности — премиум-инструмент. Оформите подписку, чтобы
                формировать полную диагностику группы, индивидуальную аналитику по студентам и коррекционный
                план без ограничений.
              </p>
              <Button
                className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90"
                onClick={user ? openUpgrade : openAuth}
              >
                <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
                {user ? "Оформить подписку" : "Войти и оформить подписку"}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 md:p-8 shadow-sm">
              <QualityAnalyticsTool />
            </div>
          )}
        </div>
      </main>

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
      />

      <DecomposerModal
        open={decomposerOpen}
        onClose={() => setDecomposerOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={openAuth} />
    </div>
  );
};

export default QualityAnalytics;
