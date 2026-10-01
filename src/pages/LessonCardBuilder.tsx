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
import LessonCardPreview from "@/components/lesson-card/LessonCardPreview";
import { OK_LIST, STAGES, TECHNOLOGIES, LESSON_TYPES, type LessonType } from "@/components/lesson-card/lessonCardConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const buildInitialTimes = (duration: string) =>
  Object.fromEntries(STAGES.map((s) => [s.key, duration === "90" ? s.t90 : s.t45])) as Record<string, number>;

const emptyContents = () => Object.fromEntries(STAGES.map((s) => [s.key, ""])) as Record<string, string>;

const LessonCardBuilder = () => {
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
  const [duration, setDuration] = useState("45");
  const [lessonType, setLessonType] = useState<LessonType>("Теоретическое занятие");
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [times, setTimes] = useState<Record<string, number>>(() => buildInitialTimes("45"));
  const [contents, setContents] = useState<Record<string, string>>(emptyContents);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimes(buildInitialTimes(duration));
  }, [duration]);

  const totalTime = useMemo(() => Object.values(times).reduce((a, b) => a + (b || 0), 0), [times]);
  const target = parseInt(duration, 10);

  const toggleList = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const previewData = {
    discipline,
    group,
    topic,
    goal,
    duration,
    lessonType,
    competencies,
    technologies,
    times,
    contents,
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
      toast.error("Укажите тему урока — без неё ИИ не сможет наполнить этапы");
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
          action: "lesson_card",
          fields: {
            discipline,
            group,
            topic,
            goal,
            duration,
            lessonType,
            competencies,
            technologies,
            times,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось наполнить карточку урока");

      if (!goal.trim() && data.goal) setGoal(data.goal);
      const aiStages = (data.stages || {}) as Record<string, string>;
      setContents((prev) => {
        const next = { ...prev };
        STAGES.forEach((s) => {
          if (aiStages[s.key]) next[s.key] = aiStages[s.key];
        });
        return next;
      });
      toast.success("Карточка урока наполнена — проверьте и при необходимости отредактируйте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось наполнить карточку урока");
    } finally {
      setLoading(false);
    }
  };

  const buildTextLines = () => {
    const lines: string[] = [
      topic.trim() || "Тема урока не указана",
      `${discipline.trim() || "Дисциплина не указана"} | ${group.trim() || "Группа не указана"}`,
      "",
      `Время урока: ${duration} мин`,
      `Тип занятия: ${lessonType}`,
      "",
      "ЦЕЛЬ УРОКА",
      goal.trim() || "не сформулирована",
      "",
      "ФОРМИРУЕМЫЕ КОМПЕТЕНЦИИ",
      ...(competencies.length ? competencies.map((c) => `- ${c}`) : ["не выбраны"]),
      "",
      "ТЕХНОЛОГИИ ОБУЧЕНИЯ",
      ...(technologies.length ? technologies.map((t) => `- ${t}`) : ["не выбраны"]),
      "",
      "ХОД УРОКА",
    ];
    STAGES.forEach((s, i) => {
      const c = (contents[s.key] || "").trim();
      if (!c) return;
      lines.push("", `${i + 1}. ${s.name} (${times[s.key] || 0} мин)`, c);
    });
    return lines;
  };

  const handleDownloadTxt = () => downloadTxt(`Карточка урока — ${topic.trim() || "без темы"}`, buildTextLines());
  const handleDownloadDocx = () =>
    downloadDocx(
      `Карточка урока — ${topic.trim() || "без темы"}`,
      topic.trim() || "Карточка урока",
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

  const totalClass =
    totalTime > target
      ? "bg-destructive/10 text-destructive"
      : totalTime < target
        ? "bg-amber-100 text-amber-800"
        : "bg-primary/10 text-primary";

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
        onOpenPricing={() => (window.location.href = "/#pricing")}
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">Конструктор карточки урока</h1>
            <p className="text-muted-foreground">
              Заполните параметры занятия, распределите время по этапам и поручите ИИ наполнить содержание. Готовую
              карточку можно распечатать или скачать в Word.
            </p>
          </div>

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

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Время урока</label>
                  <div className="flex gap-2">
                    {["45", "90"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                          duration === d
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border hover:bg-accent"
                        }`}
                      >
                        {d} минут
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Тип занятия</label>
                  <div className="flex flex-wrap gap-2">
                    {LESSON_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLessonType(t)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                          lessonType === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border hover:bg-accent"
                        }`}
                      >
                        {t === "Теоретическое занятие" ? "📖 Теоретическое" : "🛠️ Практическое"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тема урока</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Введите тему урока" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Цель урока</label>
                <Textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  placeholder="Оставьте пустым — ИИ сформулирует цель сам"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Формируемые компетенции (ОК)</label>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  {OK_LIST.map(([code, text]) => {
                    const value = `${code}. ${text}`;
                    const checked = competencies.includes(value);
                    return (
                      <label key={code} className="flex gap-2 items-start text-xs leading-snug cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Технологии обучения</label>
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

              <h2 className="font-display text-lg font-bold mt-7 mb-3 pb-2 border-b-2 border-primary/15">
                📋 Структура урока
              </h2>

              <div className="space-y-2.5">
                {STAGES.map((s, i) => (
                  <div key={s.key} className="rounded-xl border border-border border-l-4 border-l-primary bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-sm text-primary">
                        {i + 1}. {s.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>⏱</span>
                        <Input
                          type="number"
                          min={0}
                          max={90}
                          value={times[s.key] ?? 0}
                          onChange={(e) =>
                            setTimes((prev) => ({ ...prev, [s.key]: parseInt(e.target.value, 10) || 0 }))
                          }
                          className="h-8 w-16 text-center px-1"
                        />
                        <span>мин</span>
                      </div>
                    </div>
                    <Textarea
                      rows={3}
                      value={contents[s.key] || ""}
                      onChange={(e) => setContents((prev) => ({ ...prev, [s.key]: e.target.value }))}
                      placeholder={lessonType === "Практическое занятие" ? s.phPractice : s.phTheory}
                    />
                  </div>
                ))}
              </div>

              <div className={`mt-3 rounded-lg px-3 py-2.5 text-center text-sm font-semibold ${totalClass}`}>
                ⏰ Общее время: {totalTime} мин из {target} мин
                {totalTime > target && " — превышение!"}
                {totalTime < target && " — есть резерв"}
              </div>

              <Button className="w-full mt-4 gap-2" onClick={fillWithAI} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ наполняет карточку...
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