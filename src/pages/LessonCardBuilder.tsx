import { usePersistedState } from "@/hooks/use-persisted-state";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import OvzSelect from "@/components/OvzSelect";
import { toast } from "sonner";
import LessonCardPreview, { type PreviewData } from "@/components/lesson-card/LessonCardPreview";
import {
  OK_LIST,
  TECHNOLOGIES,
  LESSON_TYPES,
  LESSON_FORMS,
  PURPOSES,
  INSTITUTIONS,
  FGOS_LABELS,
  fgosForInstitution,
  makeDefaultStages,
  newStageId,
  type Institution,
  type Stage,
} from "@/components/lesson-card/lessonCardConfig";
import { takeLessonCardPrefill } from "@/components/lesson-card/prefill";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <label className="block text-sm font-semibold mb-1.5">{label}</label>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-lg font-bold mt-7 mb-3 pb-2 border-b-2 border-primary/15">{children}</h2>
);

const LessonCardBuilder = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [institution, setInstitution] = usePersistedState<Institution>("lc2_institution", "college");
  const [classNum, setClassNum] = usePersistedState("lc2_classNum", "5");
  const [courseNum, setCourseNum] = usePersistedState("lc2_courseNum", "1");
  const [pm, setPm] = usePersistedState("lc2_pm", "");
  const [mdk, setMdk] = usePersistedState("lc2_mdk", "");
  const [discipline, setDiscipline] = usePersistedState("lc2_discipline", "");
  const [specialty, setSpecialty] = usePersistedState("lc2_specialty", "");
  const [group, setGroup] = usePersistedState("lc2_group", "");
  const [teacher, setTeacher] = usePersistedState("lc2_teacher", "");
  const [topic, setTopic] = usePersistedState("lc2_topic", "");
  const [goal, setGoal] = usePersistedState("lc2_goal", "");
  const [taskEducational, setTaskEducational] = usePersistedState("lc2_taskEducational", "");
  const [taskDeveloping, setTaskDeveloping] = usePersistedState("lc2_taskDeveloping", "");
  const [taskUpbringing, setTaskUpbringing] = usePersistedState("lc2_taskUpbringing", "");
  const [technologies, setTechnologies] = usePersistedState<string[]>("lc2_technologies", []);
  const [lessonType, setLessonType] = usePersistedState("lc2_lessonType", LESSON_TYPES[0]);
  const [lessonForm, setLessonForm] = usePersistedState("lc2_lessonForm", LESSON_FORMS[0]);
  const [intersubject, setIntersubject] = usePersistedState("lc2_intersubject", "");
  const [intrasubject, setIntrasubject] = usePersistedState("lc2_intrasubject", "");
  const [materials, setMaterials] = usePersistedState("lc2_materials", "");
  const [sources, setSources] = usePersistedState("lc2_sources", "");
  const [uud, setUud] = usePersistedState("lc2_uud", "");
  const [competencies, setCompetencies] = usePersistedState<string[]>("lc2_competencies", []);
  const [extraCompetencies, setExtraCompetencies] = usePersistedState<string[]>("lc2_extraCompetencies", []);
  const [pk, setPk] = usePersistedState("lc2_pk", "");
  const [duration, setDuration] = usePersistedState("lc2_duration", "45");
  const [stages, setStages] = usePersistedState<Stage[]>("lc2_stages", () => makeDefaultStages("45"));
  const [ovz, setOvz] = usePersistedState<string[]>("lc2_ovz", []);

  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const fgos = fgosForInstitution(institution, parseInt(classNum, 10));
  const isSchool = institution === "school";
  const isCollege = institution === "college";

  useEffect(() => {
    const data = takeLessonCardPrefill();
    if (!data) return;
    const okValues = OK_LIST.map(([code, text]) => `${code}. ${text}`);
    if (data.discipline) setDiscipline(data.discipline);
    if (data.group) setGroup(data.group);
    if (data.topic) setTopic(data.topic);
    if (data.goal) setGoal(data.goal);
    if (data.duration) {
      setDuration(data.duration);
      setStages(makeDefaultStages(data.duration));
    }
    setLessonType(data.lessonType === "Практическое занятие" ? "Практическое занятие" : "Урок изучения нового материала");
    if (data.technologies?.length) setTechnologies(data.technologies);
    if (data.competencies?.length) {
      setCompetencies(data.competencies.filter((c) => okValues.includes(c)));
      setExtraCompetencies(data.competencies.filter((c) => !okValues.includes(c)));
    }
    setPrefilled(true);
  }, []);

  const target = parseInt(duration, 10);
  const totalTime = useMemo(() => stages.reduce((a, s) => a + (s.time || 0), 0), [stages]);
  const allCompetencies = useMemo(() => [...competencies, ...extraCompetencies], [competencies, extraCompetencies]);

  const toggleList = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const updateStage = (id: string, patch: Partial<Stage>) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addStage = () =>
    setStages((prev) => [
      ...prev,
      { id: newStageId(), name: "Новый этап", time: 5, purpose: PURPOSES[2], teacher: "", student: "", competency: "" },
    ]);

  const removeStage = (id: string) => setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

  const resetStages = () => {
    setStages(makeDefaultStages(duration));
    toast.success("Этапы сброшены к шаблону");
  };

  const previewData: PreviewData = {
    institution,
    fgos,
    classNum,
    courseNum,
    pm,
    mdk,
    discipline,
    specialty,
    group,
    teacher,
    topic,
    goal,
    taskEducational,
    taskDeveloping,
    taskUpbringing,
    technologies,
    lessonType,
    lessonForm,
    intersubject,
    intrasubject,
    materials,
    sources,
    uud,
    competencies: allCompetencies,
    pk,
    stages,
  };

  const buildAiFields = (withContent: boolean) => ({
    institution: INSTITUTIONS.find((i) => i.value === institution)?.label,
    fgos: FGOS_LABELS[fgos],
    classOrCourse: isSchool ? `${classNum} класс` : `${courseNum} курс`,
    discipline,
    specialty,
    pm,
    mdk,
    group,
    topic,
    goal,
    taskEducational,
    taskDeveloping,
    taskUpbringing,
    duration,
    lessonType,
    lessonForm,
    technologies,
    competencies: allCompetencies,
    pk,
    uud,
    ovz,
    stages: stages.map((s) => ({
      id: s.id,
      name: s.name,
      time: s.time,
      purpose: s.purpose,
      ...(withContent ? { teacher: s.teacher, student: s.student } : {}),
    })),
  });

  const applyAiResult = (data: {
    goal?: string;
    tasks?: { educational?: string; developing?: string; upbringing?: string };
    stages?: Record<string, { teacher?: string; student?: string }>;
  }, overwriteGoal: boolean) => {
    if (data.goal && (overwriteGoal || !goal.trim())) setGoal(data.goal);
    if (data.tasks) {
      if (data.tasks.educational && (overwriteGoal || !taskEducational.trim())) setTaskEducational(data.tasks.educational);
      if (data.tasks.developing && (overwriteGoal || !taskDeveloping.trim())) setTaskDeveloping(data.tasks.developing);
      if (data.tasks.upbringing && (overwriteGoal || !taskUpbringing.trim())) setTaskUpbringing(data.tasks.upbringing);
    }
    const ai = data.stages || {};
    setStages((prev) =>
      prev.map((s) => {
        const r = ai[s.id];
        if (!r) return s;
        return { ...s, teacher: r.teacher || s.teacher, student: r.student || s.student };
      })
    );
  };

  const callAi = async (payload: Record<string, unknown>) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Authorization": token } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось получить ответ от ИИ");
    return data;
  };

  const guard = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    if (!topic.trim()) {
      toast.error("Укажите тему урока — без неё ИИ не сможет работать");
      return false;
    }
    return true;
  };

  const fillWithAI = async () => {
    if (!guard()) return;
    setLoading(true);
    try {
      const data = await callAi({ action: "lesson_card", fields: buildAiFields(false) });
      applyAiResult(data, false);
      toast.success("Технологическая карта наполнена — проверьте и при необходимости отредактируйте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось наполнить карту");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!guard() || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const data = await callAi({
        action: "lesson_card_refine",
        instruction: refineInstruction.trim(),
        fields: buildAiFields(true),
      });
      applyAiResult(data, true);
      setRefineInstruction("");
      setRefineOpen(false);
      toast.success("Технологическая карта доработана — проверьте изменения");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать карту");
    } finally {
      setRefining(false);
    }
  };

  const buildTextLines = () => {
    const inst = INSTITUTIONS.find((i) => i.value === institution)?.label || "";
    const v = (x: string) => (x.trim() ? x.trim() : "—");
    const lines: string[] = [
      `Преподаватель: ${v(teacher)}`,
      "",
      "1. ОБЩИЕ СВЕДЕНИЯ О ЗАНЯТИИ",
      `Тип учреждения: ${inst}`,
      `ФГОС: ${FGOS_LABELS[fgos]}`,
      `Класс / курс: ${isSchool ? `${classNum} класс` : `${courseNum} курс`}`,
    ];
    if (isCollege) lines.push(`ПМ: ${v(pm)}`, `МДК: ${v(mdk)}`);
    lines.push(`Предмет / дисциплина: ${v(discipline)}`);
    if (!isSchool) lines.push(`Специальность: ${v(specialty)}`);
    if (group.trim()) lines.push(`Группа: ${group.trim()}`);
    lines.push(
      `Тема: ${v(topic)}`,
      `Цель: ${v(goal)}`,
      "Задачи:",
      `  1. Образовательная: ${v(taskEducational)}`,
      `  2. Развивающая: ${v(taskDeveloping)}`,
      `  3. Воспитательная: ${v(taskUpbringing)}`,
      `Педагогические технологии: ${technologies.length ? technologies.join(", ") : "—"}`,
      `Тип занятия: ${lessonType}`,
      `Форма организации: ${lessonForm}`,
      `Межпредметные связи: ${v(intersubject)}`,
      `Внутрипредметные связи: ${v(intrasubject)}`,
      `Информационное обеспечение: ${v(materials)}`
    );
    if (isSchool) {
      lines.push(`Формируемые УУД: ${v(uud)}`);
    } else {
      lines.push("ОК:", ...(allCompetencies.length ? allCompetencies.map((c) => `  - ${c}`) : ["  —"]), `ПК: ${v(pk)}`);
    }
    lines.push(`Источники информации: ${v(sources)}`, "", `2. ОРГАНИЗАЦИОННАЯ СТРУКТУРА ЗАНЯТИЯ (${totalTime} мин)`);
    stages.forEach((s, i) => {
      lines.push(
        "",
        `${i + 1}. ${s.name} (${s.time} мин)`,
        `Цель этапа: ${s.purpose}`,
        `Деятельность преподавателя: ${v(s.teacher)}`,
        `Деятельность обучающегося: ${v(s.student)}`
      );
      if (s.competency.trim()) lines.push(`Компетенции: ${s.competency.trim()}`);
    });
    lines.push("", `Дата: «___» ____________ 20___ г.`);
    return lines;
  };

  const fileTitle = `Технологическая карта — ${topic.trim() || "без темы"}`;
  const handleDownloadTxt = () => downloadTxt(fileTitle, [fileTitle, "", ...buildTextLines()]);
  const handleDownloadDocx = () => downloadDocx(fileTitle, "Технологическая карта учебного занятия", buildTextLines().join("\n"));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTextLines().join("\n"));
      toast.success("Текст карты скопирован в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Сбросить все поля формы?")) return;
    setPm("");
    setMdk("");
    setDiscipline("");
    setSpecialty("");
    setGroup("");
    setTopic("");
    setGoal("");
    setTaskEducational("");
    setTaskDeveloping("");
    setTaskUpbringing("");
    setTechnologies([]);
    setIntersubject("");
    setIntrasubject("");
    setMaterials("");
    setSources("");
    setUud("");
    setCompetencies([]);
    setExtraCompetencies([]);
    setPk("");
    setStages(makeDefaultStages(duration));
  };

  const totalClass =
    totalTime > target
      ? "bg-destructive/10 text-destructive"
      : totalTime < target
        ? "bg-amber-100 text-amber-800"
        : "bg-primary/10 text-primary";

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border hover:bg-accent"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
        onOpenPricing={() => setProfileOpen(true)}
      />

      <main className="flex-1">
        <div className="container py-6 sm:py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">
              Конструктор технологической карты урока
            </h1>
            <p className="text-muted-foreground">
              Заполните сведения о занятии, настройте этапы и при желании поручите ИИ наполнить цели, задачи и
              деятельность на этапах. Готовую карту можно распечатать или скачать в Word.
            </p>
          </div>

          {prefilled && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm no-print">
              <Icon name="CheckCircle2" size={17} className="text-primary mt-0.5 shrink-0" />
              <span>
                Данные перенесены из генератора уроков. Проверьте поля и нажмите «Заполнить с помощью ИИ».
              </span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm no-print">
              <h2 className="font-display text-lg font-bold mb-3 pb-2 border-b-2 border-primary/15">📋 Общие сведения</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Тип образовательного учреждения">
                  <select className={selectClass} value={institution} onChange={(e) => setInstitution(e.target.value as Institution)}>
                    {INSTITUTIONS.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ФГОС">
                  <Input value={FGOS_LABELS[fgos]} readOnly className="bg-muted/50" />
                </Field>
                {isSchool ? (
                  <Field label="Класс">
                    <select className={selectClass} value={classNum} onChange={(e) => setClassNum(e.target.value)}>
                      {Array.from({ length: 11 }, (_, i) => String(i + 1)).map((n) => (
                        <option key={n} value={n}>
                          {n} класс
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Курс">
                    <select className={selectClass} value={courseNum} onChange={(e) => setCourseNum(e.target.value)}>
                      {["1", "2", "3", "4", "5"].map((n) => (
                        <option key={n} value={n}>
                          {n} курс
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Класс / группа">
                  <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Например: ИС-21-1" />
                </Field>
                {isCollege && (
                  <>
                    <Field label="Профессиональный модуль (ПМ)">
                      <Input value={pm} onChange={(e) => setPm(e.target.value)} placeholder="ПМ.04 Осуществление интеграции программных модулей" />
                    </Field>
                    <Field label="МДК">
                      <Input value={mdk} onChange={(e) => setMdk(e.target.value)} placeholder="МДК.04.02 Технологии разработки БД" />
                    </Field>
                  </>
                )}
                <Field label="Предмет / дисциплина">
                  <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Например: Информатика" />
                </Field>
                {!isSchool && (
                  <Field label="Специальность">
                    <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="09.02.07 Информационные системы и программирование" />
                  </Field>
                )}
                <Field label="Ф.И.О. преподавателя" className="sm:col-span-2">
                  <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Иванова Мария Петровна" />
                </Field>
              </div>

              <SectionTitle>🎯 Тема, цель и задачи</SectionTitle>
              <div className="space-y-4">
                <Field label="Тема учебного занятия">
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Введите тему урока" />
                </Field>
                <Field label="Цель учебного занятия">
                  <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} placeholder="Оставьте пустым — ИИ сформулирует цель сам" />
                </Field>
                <Field label="Образовательная задача">
                  <Textarea value={taskEducational} onChange={(e) => setTaskEducational(e.target.value)} rows={2} placeholder="Изучить, закрепить, сформировать..." />
                </Field>
                <Field label="Развивающая задача">
                  <Textarea value={taskDeveloping} onChange={(e) => setTaskDeveloping(e.target.value)} rows={2} placeholder="Развивать мышление, навыки, умения..." />
                </Field>
                <Field label="Воспитательная задача">
                  <Textarea value={taskUpbringing} onChange={(e) => setTaskUpbringing(e.target.value)} rows={2} placeholder="Воспитывать культуру, ответственность..." />
                </Field>
              </div>

              <SectionTitle>⚙️ Методические параметры</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Тип учебного занятия">
                  <select className={selectClass} value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
                    {LESSON_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Форма организации занятия">
                  <select className={selectClass} value={lessonForm} onChange={(e) => setLessonForm(e.target.value)}>
                    {LESSON_FORMS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Время урока" className="sm:col-span-2">
                  <div className="flex gap-2">
                    {["45", "90"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDuration(d);
                          setStages(makeDefaultStages(d));
                        }}
                        className={chip(duration === d)}
                      >
                        {d} минут
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">При смене времени этапы возвращаются к шаблону.</p>
                </Field>
                <Field label="Межпредметные связи" className="sm:col-span-2">
                  <Input value={intersubject} onChange={(e) => setIntersubject(e.target.value)} placeholder="Математика, русский язык, физика..." />
                </Field>
                <Field label="Внутрипредметные связи" className="sm:col-span-2">
                  <Input value={intrasubject} onChange={(e) => setIntrasubject(e.target.value)} placeholder="Связь с темами..." />
                </Field>
                <Field label="Информационное обеспечение" className="sm:col-span-2">
                  <Textarea value={materials} onChange={(e) => setMaterials(e.target.value)} rows={2} placeholder="Презентация, раздаточный материал, ПО..." />
                </Field>
                <Field label="Используемые источники информации" className="sm:col-span-2">
                  <Textarea value={sources} onChange={(e) => setSources(e.target.value)} rows={3} placeholder={"1. Учебник...\n2. Электронный ресурс..."} />
                </Field>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Педагогические технологии</label>
                <div className="flex flex-wrap gap-2">
                  {TECHNOLOGIES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleList(technologies, t, setTechnologies)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                        technologies.includes(t)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <SectionTitle>🎓 Формируемые компетенции</SectionTitle>
              {isSchool ? (
                <Field label="Формируемые УУД">
                  <Textarea value={uud} onChange={(e) => setUud(e.target.value)} rows={3} placeholder="Личностные, регулятивные, познавательные, коммуникативные УУД" />
                </Field>
              ) : (
                <>
                  <label className="block text-sm font-semibold mb-1.5">Общие компетенции (ОК)</label>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    {OK_LIST.map(([code, text]) => {
                      const value = `${code}. ${text}`;
                      return (
                        <label key={code} className="flex gap-2 items-start text-xs leading-snug cursor-pointer">
                          <input
                            type="checkbox"
                            checked={competencies.includes(value)}
                            onChange={() => toggleList(competencies, value, setCompetencies)}
                            className="mt-0.5 shrink-0"
                          />
                          <span>
                            <b className="text-primary">{code}.</b> {text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {extraCompetencies.length > 0 && (
                    <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
                      <p className="text-xs font-semibold text-primary mb-1.5">Перенесены из генератора уроков:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extraCompetencies.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setExtraCompetencies((prev) => prev.filter((x) => x !== c))}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                          >
                            {c}
                            <Icon name="X" size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Field label="Профессиональные компетенции (ПК)" className="mt-4">
                    <Textarea value={pk} onChange={(e) => setPk(e.target.value)} rows={3} placeholder="ПК 2.1. Разрабатывать код модулей..." />
                  </Field>
                </>
              )}

              <SectionTitle>📊 Этапы учебного занятия</SectionTitle>
              <div className="space-y-3">
                {stages.map((s, i) => (
                  <div key={s.id} className="rounded-xl border border-border border-l-4 border-l-primary bg-muted/30 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-primary shrink-0">{i + 1}.</span>
                      <Input
                        value={s.name}
                        onChange={(e) => updateStage(s.id, { name: e.target.value })}
                        className="h-8 flex-1 min-w-[140px]"
                        aria-label="Название этапа"
                      />
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>⏱</span>
                        <Input
                          type="number"
                          min={0}
                          max={90}
                          value={s.time}
                          onChange={(e) => updateStage(s.id, { time: parseInt(e.target.value, 10) || 0 })}
                          className="h-8 w-16 text-center px-1"
                        />
                        <span>мин</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeStage(s.id)}
                        disabled={stages.length <= 1}
                        aria-label="Удалить этап"
                      >
                        <Icon name="Trash2" size={15} />
                      </Button>
                    </div>
                    <select className={selectClass} value={s.purpose} onChange={(e) => updateStage(s.id, { purpose: e.target.value })} aria-label="Цель этапа">
                      {(PURPOSES.includes(s.purpose) ? PURPOSES : [s.purpose, ...PURPOSES]).map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    <Textarea rows={3} value={s.teacher} onChange={(e) => updateStage(s.id, { teacher: e.target.value })} placeholder="Деятельность преподавателя" />
                    <Textarea rows={3} value={s.student} onChange={(e) => updateStage(s.id, { student: e.target.value })} placeholder="Деятельность студента, форма организации" />
                    <Input value={s.competency} onChange={(e) => updateStage(s.id, { competency: e.target.value })} placeholder="Компетенции этапа: ОК 1, ПК 2.1..." />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addStage}>
                  <Icon name="Plus" size={15} />
                  Добавить этап
                </Button>
                <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={resetStages}>
                  <Icon name="RotateCcw" size={15} />
                  Этапы по шаблону
                </Button>
              </div>

              <div className={`mt-3 rounded-lg px-3 py-2.5 text-center text-sm font-semibold ${totalClass}`}>
                ⏰ Общее время: {totalTime} мин из {target} мин
                {totalTime > target && " — превышение!"}
                {totalTime < target && " — есть резерв"}
              </div>

              <div className="mt-4">
                <OvzSelect value={ovz} onChange={setOvz} disabled={loading} />
              </div>

              <Button className="w-full mt-4 gap-2" onClick={fillWithAI} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ наполняет карту...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={17} />
                    Заполнить с помощью ИИ
                  </>
                )}
              </Button>
              {!isPaid && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  ИИ-наполнение доступно по подписке. Форму можно заполнить вручную и распечатать бесплатно.
                </p>
              )}

              {!refineOpen ? (
                <Button
                  variant="outline"
                  className="w-full mt-2.5 gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setRefineOpen(true)}
                >
                  <Icon name="Sparkles" size={16} />
                  Доработать с ИИ
                </Button>
              ) : (
                <div className="mt-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                  <label className="text-sm font-medium block">Что доработать или исправить?</label>
                  <Textarea
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Например: сделай этап «Самостоятельная работа» более практическим, добавь примеры по теме, перефразируй цель..."
                    rows={3}
                  />
                  {refineError && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <Icon name="AlertCircle" size={14} />
                      {refineError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setRefineOpen(false);
                        setRefineInstruction("");
                        setRefineError(null);
                      }}
                      disabled={refining}
                    >
                      Отмена
                    </Button>
                    <Button size="sm" className="flex-1 gap-1.5" onClick={handleRefine} disabled={refining || !refineInstruction.trim()}>
                      {refining ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Sparkles" size={15} />}
                      Применить
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" className="w-full mt-2.5 gap-2 text-muted-foreground" onClick={handleReset}>
                <Icon name="RotateCcw" size={15} />
                Сбросить поля
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 no-print">👁️ Предпросмотр карты</h2>
              <LessonCardPreview data={previewData} />
              <div className="mt-4 flex flex-wrap gap-2 no-print">
                <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
                  <Icon name="Printer" size={15} />
                  Печать / PDF
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleDownloadDocx}>
                  <Icon name="FileText" size={15} />
                  Скачать Word
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleDownloadTxt}>
                  <Icon name="Download" size={15} />
                  Скачать TXT
                </Button>
                <Button variant="ghost" className="gap-1.5" onClick={handleCopy}>
                  <Icon name="Copy" size={15} />
                  Копировать
                </Button>
              </div>
            </div>
          </div>
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
        onNeedAuth={() => {
          setDecomposerOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setDecomposerOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={() => {
          setAntiplagiatOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setAntiplagiatOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNeedAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onNeedAuth={() => {
          setUpgradeOpen(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
};

export default LessonCardBuilder;