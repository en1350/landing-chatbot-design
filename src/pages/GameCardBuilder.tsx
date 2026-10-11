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
import GameCardPreview from "@/components/game-card/GameCardPreview";
import {
  GAME_GOALS,
  GAME_PEOPLE,
  GAME_TIMES,
  GAME_TYPES,
  GameStage,
  takeGameCardPrefill,
} from "@/components/game-card/gameCardConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const GameCardBuilder = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [topic, setTopic] = useState("");
  const [gameType, setGameType] = useState<string>(GAME_TYPES[0]);
  const [time, setTime] = useState<string>(GAME_TIMES[1]);
  const [people, setPeople] = useState<string>(GAME_PEOPLE[2]);
  const [goal, setGoal] = useState<string>(GAME_GOALS[2]);
  const [scenario, setScenario] = useState("");

  const [aiGoal, setAiGoal] = useState("");
  const [stages, setStages] = useState<GameStage[]>([]);
  const [rules, setRules] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [criteria, setCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    const data = takeGameCardPrefill();
    if (!data) return;
    if (data.topic) setTopic(data.topic);
    if (data.time && (GAME_TIMES as readonly string[]).includes(data.time)) setTime(data.time);
    if (data.people && (GAME_PEOPLE as readonly string[]).includes(data.people)) setPeople(data.people);
    setPrefilled(true);
  }, []);

  const previewData = {
    topic,
    gameType,
    time,
    people,
    goal,
    scenario,
    aiGoal,
    stages,
    rules,
    materials,
    tips,
    criteria,
  };

  const generate = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (!topic.trim()) {
      toast.error("Укажите тему урока — без неё ИИ не сможет придумать игру");
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
          action: "game_card",
          fields: { topic, gameType, time, people, goal, scenario },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить игру");

      setAiGoal(data.goal || "");
      setStages(data.stages || []);
      setRules(data.rules || "");
      setMaterials(data.materials || []);
      setTips(data.tips || []);
      setCriteria(data.criteria || "");
      toast.success("Игра готова — карточка справа");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить игру");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setTopic("");
    setScenario("");
    setAiGoal("");
    setStages([]);
    setRules("");
    setMaterials([]);
    setTips([]);
    setCriteria("");
  };

  const buildTextLines = () => [
    `${gameType} — ${topic.trim() || "тема не указана"}`,
    "",
    `Время: ${time}`,
    `Участников: ${people}`,
    `Цель: ${goal}`,
    ...(aiGoal ? ["", "ЦЕЛЬ ИГРЫ", aiGoal] : []),
    ...(stages.length
      ? [
          "",
          "ХОД ИГРЫ",
          ...stages.map((s, i) => `${i + 1}. ${s.name}${s.minutes ? ` (${s.minutes} мин)` : ""}: ${s.description}`),
        ]
      : []),
    ...(rules ? ["", "ПРАВИЛА", rules] : []),
    ...(materials.length ? ["", "МАТЕРИАЛЫ", ...materials.map((m) => `- ${m}`)] : []),
    ...(tips.length ? ["", "СОВЕТЫ ВЕДУЩЕМУ", ...tips.map((t) => `- ${t}`)] : []),
    ...(criteria ? ["", "ПОДВЕДЕНИЕ ИТОГОВ", criteria] : []),
    ...(scenario.trim() ? ["", "ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ", scenario.trim()] : []),
  ];

  const fileTitle = `Карточка игры — ${topic.trim() || "без темы"}`;
  const handleDownloadTxt = () => downloadTxt(fileTitle, buildTextLines());
  const handleDownloadDocx = () =>
    downloadDocx(fileTitle, topic.trim() || "Карточка игры", buildTextLines().slice(1).join("\n"));

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">Конструктор игровых уроков</h1>
            <p className="text-muted-foreground">
              Выберите параметры игры — ИИ придумает сценарий с таймингом, правилами и материалами. Готовую
              карточку можно распечатать или скачать в Word.
            </p>
          </div>

          {prefilled && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm no-print">
              <Icon name="CheckCircle2" size={17} className="text-primary mt-0.5 shrink-0" />
              <span>Данные перенесены из генератора игры. Проверьте поля и нажмите «Составить игру с помощью ИИ».</span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm no-print">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Тема урока</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Фотосинтез, Деление дробей..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Вид игры</label>
                <div className="flex flex-wrap gap-2">
                  {GAME_TYPES.map((v) => (
                    <button key={v} type="button" onClick={() => setGameType(v)} className={chip(gameType === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Время проведения</label>
                <div className="flex flex-wrap gap-2">
                  {GAME_TIMES.map((v) => (
                    <button key={v} type="button" onClick={() => setTime(v)} className={chip(time === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Количество человек</label>
                <div className="flex flex-wrap gap-2">
                  {GAME_PEOPLE.map((v) => (
                    <button key={v} type="button" onClick={() => setPeople(v)} className={chip(people === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Цель игры</label>
                <div className="flex flex-wrap gap-2">
                  {GAME_GOALS.map((v) => (
                    <button key={v} type="button" onClick={() => setGoal(v)} className={chip(goal === v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Сценарий / дополнительные условия</label>
                <Textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  rows={4}
                  placeholder="Особые условия, материалы, ограничения, пожелания..."
                />
              </div>

              <Button className="w-full mt-5 gap-2" onClick={generate} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ придумывает игру...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={17} />
                    Составить игру с помощью ИИ
                  </>
                )}
              </Button>
              {!isPaid && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  ИИ-наполнение доступно по подписке. Карточку с параметрами можно распечатать бесплатно.
                </p>
              )}
              <Button variant="ghost" className="w-full mt-2 gap-2 text-muted-foreground" onClick={resetAll}>
                <Icon name="RotateCcw" size={15} />
                Сбросить
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 no-print">👁️ Карточка игры</h2>
              <GameCardPreview data={previewData} />
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

export default GameCardBuilder;
