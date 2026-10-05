import { useEffect, useState } from "react";
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
import EventCardPreview from "@/components/event-card/EventCardPreview";
import {
  DEFAULT_SCENARIO,
  EVENT_AUDIENCES,
  EVENT_DURATIONS,
  EVENT_FORMATS,
  EVENT_LEVELS,
  EVENT_MODES,
  takeEventPrefill,
  type ScenarioBlock,
} from "@/components/event-card/eventCardConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

let idCounter = 1;
const nextId = () => idCounter++;
const defaultScenario = (): ScenarioBlock[] => DEFAULT_SCENARIO.map((s) => ({ ...s, id: nextId() }));

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
    active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border hover:bg-accent"
  }`;

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-semibold mb-1.5">{children}</label>
);

const EventCardBuilder = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<string>(EVENT_FORMATS[0]);
  const [audience, setAudience] = useState<string>(EVENT_AUDIENCES[0]);
  const [duration, setDuration] = useState<string>("45 минут");
  const [level, setLevel] = useState<string>(EVENT_LEVELS[0]);
  const [mode, setMode] = useState<string>(EVENT_MODES[0]);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [minParticipants, setMinParticipants] = useState("5");
  const [maxParticipants, setMaxParticipants] = useState("20");
  const [speaker, setSpeaker] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [materials, setMaterials] = useState("");
  const [contacts, setContacts] = useState("");
  const [price, setPrice] = useState("0");
  const [scenario, setScenario] = useState<ScenarioBlock[]>(defaultScenario);

  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  useEffect(() => {
    const data = takeEventPrefill();
    if (!data) return;
    if (data.title) setTitle(data.title);
    if (data.format) setFormat(data.format);
    if (data.audience) setAudience(data.audience);
    if (data.duration) setDuration(data.duration);
    if (data.description) setDescription(data.description);
    setPrefilled(true);
  }, []);

  const previewData = {
    title,
    format,
    audience,
    duration,
    level,
    mode,
    date,
    location,
    minParticipants,
    maxParticipants,
    speaker,
    description,
    result,
    materials,
    contacts,
    price,
    scenario,
  };

  const updateBlock = (id: number, key: keyof Omit<ScenarioBlock, "id">, value: string) =>
    setScenario((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  const addBlock = () => setScenario((prev) => [...prev, { id: nextId(), title: "", time: "", desc: "" }]);
  const removeBlock = (id: number) => setScenario((prev) => prev.filter((s) => s.id !== id));

  const aiFields = () => ({
    title,
    format,
    audience,
    duration,
    level,
    mode,
    minParticipants,
    maxParticipants,
    description,
    result,
    materials,
    scenario: scenario.map(({ title: t, time, desc }) => ({ title: t, time, desc })),
  });

  const applyAI = (data: {
    description?: string;
    result?: string;
    materials?: string;
    scenario?: { title: string; time: string; desc: string }[];
  }) => {
    if (data.description) setDescription(data.description);
    if (data.result) setResult(data.result);
    if (data.materials) setMaterials(data.materials);
    if (data.scenario?.length) {
      setScenario(data.scenario.map((s) => ({ id: nextId(), title: s.title, time: s.time, desc: s.desc })));
    }
  };

  const callAI = async (action: "event_card" | "event_card_refine", instruction?: string) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Authorization": token } : {}),
      },
      body: JSON.stringify({ action, fields: aiFields(), ...(instruction ? { instruction } : {}) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось получить ответ от ИИ");
    return data;
  };

  const checkAccess = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    if (!title.trim()) {
      toast.error("Укажите название события — без него ИИ не сможет работать");
      return false;
    }
    return true;
  };

  const fillWithAI = async () => {
    if (!checkAccess()) return;
    setLoading(true);
    try {
      applyAI(await callAI("event_card"));
      toast.success("Карточка события наполнена — проверьте и при необходимости отредактируйте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось наполнить карточку");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!checkAccess() || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      applyAI(await callAI("event_card_refine", refineInstruction.trim()));
      setRefineInstruction("");
      setRefineOpen(false);
      toast.success("Карточка события доработана — проверьте изменения");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать карточку");
    } finally {
      setRefining(false);
    }
  };

  const resetForm = () => {
    if (!window.confirm("Очистить все поля?")) return;
    setTitle("");
    setFormat(EVENT_FORMATS[0]);
    setAudience(EVENT_AUDIENCES[0]);
    setDuration("45 минут");
    setLevel(EVENT_LEVELS[0]);
    setMode(EVENT_MODES[0]);
    setDate("");
    setLocation("");
    setMinParticipants("5");
    setMaxParticipants("20");
    setSpeaker("");
    setDescription("");
    setResult("");
    setMaterials("");
    setContacts("");
    setPrice("0");
    setScenario(defaultScenario());
  };

  const buildTextLines = () => {
    const p = parseInt(price, 10) || 0;
    const lines: string[] = [
      title.trim() || "Название не указано",
      `${format} · ${level} · для: ${audience.toLowerCase()} · ${mode}`,
      "",
      `Длительность: ${duration}`,
      `Дата: ${date ? new Date(date).toLocaleDateString("ru-RU") : "уточняется"}`,
      `Участников: ${minParticipants}–${maxParticipants}`,
      `Стоимость: ${p === 0 ? "бесплатно" : `${p} ₽`}`,
    ];
    if (location.trim()) lines.push(`Место / платформа: ${location.trim()}`);
    if (speaker.trim()) lines.push(`Ведущий: ${speaker.trim()}`);
    if (description.trim()) lines.push("", "О СОБЫТИИ", description.trim());
    if (result.trim()) lines.push("", "РЕЗУЛЬТАТ ДЛЯ УЧАСТНИКА", result.trim());
    const blocks = scenario.filter((s) => s.title.trim() || s.desc.trim());
    if (blocks.length) {
      lines.push("", "СЦЕНАРИЙ");
      blocks.forEach((s, i) => {
        lines.push("", `${i + 1}. ${s.title.trim() || "Этап"}${s.time.trim() ? ` (${s.time.trim()})` : ""}`);
        if (s.desc.trim()) lines.push(s.desc.trim());
      });
    }
    const mats = materials.split("\n").filter((m) => m.trim());
    if (mats.length) lines.push("", "НЕОБХОДИМЫЕ МАТЕРИАЛЫ", ...mats.map((m) => `- ${m.trim()}`));
    if (contacts.trim()) lines.push("", "КОНТАКТЫ", contacts.trim());
    return lines;
  };

  const fileName = `Карточка события — ${title.trim() || "без названия"}`;
  const handleDownloadTxt = () => downloadTxt(fileName, buildTextLines());
  const handleDownloadDocx = () =>
    downloadDocx(fileName, title.trim() || "Карточка события", buildTextLines().slice(1).join("\n"));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTextLines().join("\n"));
      toast.success("Текст карточки скопирован в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">
              Конструктор мастер-классов и событий
            </h1>
            <p className="text-muted-foreground">
              Мастер-классы, интенсивы, воркшопы, тренинги и хакатоны: задайте параметры, соберите сценарий и поручите
              ИИ наполнить или доработать карточку. Готовую карточку можно распечатать или скачать.
            </p>
          </div>

          {prefilled && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm no-print">
              <Icon name="CheckCircle2" size={17} className="text-primary mt-0.5 shrink-0" />
              <span>
                Данные перенесены из генератора интенсивов. Проверьте поля и нажмите «Заполнить с помощью ИИ».
              </span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm no-print">
              <div>
                <Label>Название / тема</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Основы веб-дизайна" />
              </div>

              <div className="mt-4">
                <Label>Формат</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_FORMATS.map((v) => (
                    <button key={v} type="button" onClick={() => setFormat(v)} className={chip(format === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label>Целевая аудитория</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_AUDIENCES.map((v) => (
                    <button key={v} type="button" onClick={() => setAudience(v)} className={chip(audience === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label>Длительность</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_DURATIONS.map((v) => (
                    <button key={v} type="button" onClick={() => setDuration(v)} className={chip(duration === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <Label>Уровень сложности</Label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_LEVELS.map((v) => (
                      <button key={v} type="button" onClick={() => setLevel(v)} className={chip(level === v)}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Проведение</Label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_MODES.map((v) => (
                      <button key={v} type="button" onClick={() => setMode(v)} className={chip(mode === v)}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <Label>Дата проведения</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Место / платформа</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Адрес или ссылка на Zoom" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <Label>Мин. участников</Label>
                  <Input type="number" min={1} value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} />
                </div>
                <div>
                  <Label>Макс. участников</Label>
                  <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <Label>Ведущий / спикер</Label>
                <Input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Имя Фамилия" />
              </div>

              <div className="mt-4">
                <Label>Описание / цели</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Чему научатся участники? Можно оставить пустым — ИИ напишет сам"
                />
              </div>

              <div className="mt-4">
                <Label>Результат для участника</Label>
                <Textarea
                  rows={2}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Что получит участник после события?"
                />
              </div>

              <h2 className="font-display text-lg font-bold mt-7 mb-3 pb-2 border-b-2 border-primary/15">
                🎬 Сценарий мероприятия
              </h2>
              <div className="space-y-2.5">
                {scenario.map((s, i) => (
                  <div key={s.id} className="rounded-xl border border-border border-l-4 border-l-primary bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm text-primary">Этап {i + 1}</span>
                      {scenario.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBlock(s.id)}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Icon name="X" size={12} />
                          Удалить
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                      <Input value={s.title} onChange={(e) => updateBlock(s.id, "title", e.target.value)} placeholder="Название этапа" />
                      <Input value={s.time} onChange={(e) => updateBlock(s.id, "time", e.target.value)} placeholder="10 мин" />
                    </div>
                    <Textarea
                      className="mt-2"
                      rows={2}
                      value={s.desc}
                      onChange={(e) => updateBlock(s.id, "desc", e.target.value)}
                      placeholder="Описание / содержание этапа"
                    />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-2.5 gap-1.5 border-dashed border-primary/40 text-primary" onClick={addBlock}>
                <Icon name="Plus" size={15} />
                Добавить этап
              </Button>

              <div className="mt-4">
                <Label>Необходимые материалы</Label>
                <Textarea
                  rows={3}
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="Каждый пункт с новой строки"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <Label>Контакты для связи</Label>
                  <Input value={contacts} onChange={(e) => setContacts(e.target.value)} placeholder="Email, телефон или Telegram" />
                </div>
                <div>
                  <Label>Стоимость (₽, 0 = бесплатно)</Label>
                  <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>

              <Button className="w-full mt-5 gap-2" onClick={fillWithAI} disabled={loading}>
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
                    placeholder="Например: добавь больше практики, сократи вступление, сделай сценарий для 3 часов..."
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
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
                      onClick={handleRefine}
                      disabled={refining || !refineInstruction.trim()}
                    >
                      {refining ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Sparkles" size={15} />}
                      Применить
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" className="w-full mt-2 gap-1.5 text-muted-foreground" onClick={resetForm}>
                <Icon name="RotateCcw" size={14} />
                Сбросить форму
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 no-print">👁️ Предпросмотр карточки</h2>
              <EventCardPreview data={previewData} />
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
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
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

export default EventCardBuilder;
