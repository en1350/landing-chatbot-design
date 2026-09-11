import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import InfoBasicsInteractive from "@/components/student-trainer/InfoBasicsInteractive";
import AlgorithmsTask from "@/components/student-trainer/AlgorithmsTask";
import BackwardsAnalysisTask from "@/components/student-trainer/BackwardsAnalysisTask";
import NetworkProtocolsTask from "@/components/student-trainer/NetworkProtocolsTask";

/* ---------- Список тренажёров ---------- */

type TrainerKey =
  | "info-basics"
  | "algorithms"
  | "backwards"
  | "network-protocols"
  | "ai-arcade"
  | "it-project-simulator";

interface TrainerItem {
  key: TrainerKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
  paid?: boolean;
}

const TRAINERS: TrainerItem[] = [
  {
    key: "info-basics",
    icon: "📚",
    title: "Работа с информацией",
    description: "Тест, классификация, сопоставление и обработчик текста — один интерактив в 4 шага",
    accent: "#2563EB",
  },
  {
    key: "algorithms",
    icon: "🧩",
    title: "Алгоритмические конструкции",
    description: "Теория и тест по линейным алгоритмам, ветвлению, циклам",
    accent: "#16A34A",
  },
  {
    key: "backwards",
    icon: "🧠",
    title: "Анализ с конца",
    description: "Логические задачи на монеты, яблоки и улитку с решением и псевдокодом",
    accent: "#0EA5E9",
    paid: true,
  },
  {
    key: "network-protocols",
    icon: "🌐",
    title: "Сетевые протоколы",
    description: "Теория по модели OSI и TCP/IP, тест и именной сертификат по итогам",
    accent: "#0891B2",
  },
  {
    key: "ai-arcade",
    icon: "🤖",
    title: "AI Arcade: Архитектура нейросети",
    description: "Аркада на 5 уровней про сбор данных, обучение весов и архитектуру нейросети — с сертификатом",
    accent: "#ff00e6",
    paid: true,
  },
  {
    key: "it-project-simulator",
    icon: "🚀",
    title: "IT Project Simulator",
    description: "Командная игра по управлению IT-проектами: 4 кризисных этапа, оценка решений и лидерборд",
    accent: "#3B82F6",
    paid: true,
  },
];

/* ---------- Страница ---------- */

const StudentTrainer = () => {
  const { user, isPaid } = useAuth();
  const [active, setActive] = useState<TrainerKey | null>(null);
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

  const handleSelect = (t: TrainerItem) => {
    if (t.paid && !isPaid) {
      user ? openUpgrade() : openAuth();
      return;
    }
    setActive(t.key);
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

          {!active ? (
            <>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-coral">Для учеников</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
                  <span className="text-3xl">🧠</span> Тренажёры для учеников
                </h1>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Выберите тренажёр — тесты, классификация, сопоставление и обработка текста
                  прямо в браузере.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TRAINERS.map((t, i) => {
                  const locked = t.paid && !isPaid;
                  return (
                    <button
                      key={t.key}
                      onClick={() => handleSelect(t)}
                      className="group relative text-left rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      {locked && (
                        <span className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon name="Lock" size={13} />
                        </span>
                      )}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${t.accent}1A` }}
                      >
                        {t.icon}
                      </div>
                      <h3 className="font-display font-bold text-base mb-1.5">{t.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {t.description}
                      </p>
                      {locked ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <Icon name="Sparkles" size={15} />
                          Доступно по подписке
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                          style={{ color: t.accent }}
                        >
                          Начать
                          <Icon name="ArrowRight" size={15} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setActive(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <Icon name="ArrowLeft" size={15} />
                Все тренажёры
              </button>

              <div className="max-w-2xl mb-6">
                <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2.5">
                  <span className="text-2xl">{TRAINERS.find((t) => t.key === active)?.icon}</span>
                  {TRAINERS.find((t) => t.key === active)?.title}
                </h1>
              </div>

              {TRAINERS.find((t) => t.key === active)?.paid && !isPaid ? (
                <div className="max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
                    🔒
                  </div>
                  <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">
                    Этот тренажёр — премиум-инструмент. Оформите подписку, чтобы открыть его без
                    ограничений.
                  </p>
                  <Button
                    className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90"
                    onClick={user ? openUpgrade : openAuth}
                  >
                    <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
                    {user ? "Оформить подписку" : "Войти и оформить подписку"}
                  </Button>
                </div>
              ) : active === "ai-arcade" ? (
                <div className="rounded-2xl border border-border bg-card p-3 md:p-5 shadow-sm max-w-[840px] overflow-x-auto">
                  <iframe
                    src="/ai-arcade.html"
                    title="AI Arcade: Архитектура нейросети"
                    className="w-[800px] h-[600px] rounded-xl border-0"
                  />
                </div>
              ) : active === "it-project-simulator" ? (
                <div className="rounded-2xl border border-border bg-card p-3 md:p-5 shadow-sm max-w-[940px] overflow-x-auto">
                  <iframe
                    src="/it-project-simulator.html"
                    title="IT Project Simulator"
                    className="w-full min-w-[600px] h-[900px] rounded-xl border-0"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-5 md:p-8 shadow-sm max-w-2xl">
                  {active === "info-basics" && <InfoBasicsInteractive />}
                  {active === "algorithms" && <AlgorithmsTask />}
                  {active === "backwards" && <BackwardsAnalysisTask />}
                  {active === "network-protocols" && <NetworkProtocolsTask />}
                </div>
              )}
            </>
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

export default StudentTrainer;
