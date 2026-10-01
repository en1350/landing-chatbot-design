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
import { toast } from "sonner";
import TaskCardPreview from "@/components/task-card/TaskCardPreview";
import { TIME_OPTIONS, TASK_TYPES, takeTaskCardPrefill } from "@/components/task-card/taskCardConfig";
import { OK_LIST } from "@/components/lesson-card/lessonCardConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const TaskCardBuilder = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [discipline, setDiscipline] = useState("");
  const [group, setGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [task, setTask] = useState("");
  const [criteria, setCriteria] = useState("");
  const [time, setTime] = useState<string>(TIME_OPTIONS[0]);
  const [taskType, setTaskType] = useState<string>(TASK_TYPES[0]);
  const [selfAssessment, setSelfAssessment] = useState("Да");
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [extraCompetencies, setExtraCompetencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    const data = takeTaskCardPrefill();
    if (!data) return;
    const okValues = OK_LIST.map(([code, text]) => `${code}. ${text}`);
    if (data.discipline) setDiscipline(data.discipline);
    if (data.group) setGroup(data.group);
    if (data.topic) setTopic(data.topic);
    if (data.goal) setGoal(data.goal);
    if (data.taskType) setTaskType(data.taskType);
    if (data.competencies?.length) {
      setCompetencies(data.competencies.filter((c) => okValues.includes(c)));
      setExtraCompetencies(data.competencies.filter((c) => !okValues.includes(c)));
    }
    setPrefilled(true);
  }, []);

  const allCompetencies = useMemo(
    () => [...competencies, ...extraCompetencies],
    [competencies, extraCompetencies]
  );

  const toggleCompetency = (value: string) =>
    setCompetencies((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));

  const previewData = {
    discipline,
    group,
    topic,
    goal,
    task,
    criteria,
    time,
    taskType,
    selfAssessment,
    competencies: allCompetencies,
  };

  const fillWithAI = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (!topic.trim()) {
      toast.error("Укажите тему задания — без неё ИИ не сможет его составить");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Authorization": token } : {}),
        },
        body: JSON.stringify({
          action: "task_card",
          fields: {
            discipline,
            group,
            topic,
            goal,
            task,
            time,
            taskType,
            selfAssessment,
            competencies: allCompetencies,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить задание");

      if (data.goal) setGoal(data.goal);
      if (data.task) setTask(data.task);
      if (data.criteria) setCriteria(data.criteria);
      toast.success("Задание готово — проверьте и при необходимости отредактируйте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить задание");
    } finally {
      setLoading(false);
    }
  };

  const buildTextLines = () => [
    topic.trim() || "Тема задания не указана",
    `${discipline.trim() || "Дисциплина не указана"} | ${group.trim() || "Группа не указана"}`,
    "",
    `Время выполнения: ${time}`,
    `Тип задания: ${taskType}`,
    `Самооценка: ${selfAssessment}`,
    "",
    "ЦЕЛЬ ЗАДАНИЯ",
    goal.trim() || "не сформулирована",
    "",
    "ТЕКСТ ЗАДАНИЯ",
    task.trim() || "не введён",
    ...(criteria.trim() ? ["", "КРИТЕРИИ ОЦЕНКИ", criteria.trim()] : []),
    "",
    "ФОРМИРУЕМЫЕ КОМПЕТЕНЦИИ",
    ...(allCompetencies.length ? allCompetencies.map((c) => `- ${c}`) : ["не выбраны"]),
  ];

  const handleDownloadTxt = () => downloadTxt(`Карточка задания — ${topic.trim() || "без темы"}`, buildTextLines());
  const handleDownloadDocx = () =>
    downloadDocx(
      `Карточка задания — ${topic.trim() || "без темы"}`,
      topic.trim() || "Карточка задания",
      buildTextLines().slice(1).join("\n")
    );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTextLines().join("\n"));
      toast.success("Текст карточки скопирован в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
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
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">Конструктор учебных заданий</h1>
            <p className="text-muted-foreground">
              Задайте параметры задания — ИИ составит формулировку и критерии оценки. Готовую карточку можно
              распечатать или скачать в Word.
            </p>
          </div>

          {prefilled && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm no-print">
              <Icon name="CheckCircle2" size={17} className="text-primary mt-0.5 shrink-0" />
              <span>Данные перенесены из генератора заданий. Проверьте поля и нажмите «Заполнить с помощью ИИ».</span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ===== ФОРМА ===== */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm no-print">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Дисциплина</label>
                  <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Например: Информатика" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Класс / группа</label>
                  <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Например: ИС-21-1" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тема задания</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Введите тему задания" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Время выполнения</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button key={t} type="button" onClick={() => setTime(t)} className={chip(time === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тип задания</label>
                <div className="flex flex-wrap gap-2">
                  {TASK_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setTaskType(t)} className={chip(taskType === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Цель задания</label>
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={2}
                  placeholder="Оставьте пустым — ИИ сформулирует цель сам"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Текст задания</label>
                <Textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  rows={5}
                  placeholder="Опишите суть задания или оставьте пустым — ИИ составит его сам"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Критерии оценки</label>
                <Textarea
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  rows={3}
                  placeholder="Как будет оцениваться задание — или оставьте ИИ"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Формируемые компетенции (ОК)</label>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  {OK_LIST.map(([code, text]) => {
                    const value = `${code}. ${text}`;
                    return (
                      <label key={code} className="flex gap-2 items-start text-xs leading-snug cursor-pointer">
                        <input
                          type="checkbox"
                          checked={competencies.includes(value)}
                          onChange={() => toggleCompetency(value)}
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
                    <p className="text-xs font-semibold text-primary mb-1.5">Перенесены из генератора заданий:</p>
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Предусмотрена самооценка?</label>
                <div className="flex gap-2">
                  {["Да", "Нет"].map((v) => (
                    <button key={v} type="button" onClick={() => setSelfAssessment(v)} className={chip(selfAssessment === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full mt-5 gap-2" onClick={fillWithAI} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ составляет задание...
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
            </div>

            {/* ===== ПРЕДПРОСМОТР ===== */}
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 no-print">👁️ Предпросмотр карточки</h2>
              <TaskCardPreview data={previewData} />
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

export default TaskCardBuilder;
