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
import TrainerFullscreen from "@/components/student-trainer/TrainerFullscreen";

/* ---------- Список тренажёров ---------- */

type CategoryKey = "informatics" | "networks" | "programming" | "os";

type TrainerKey =
  | "info-basics"
  | "algorithms"
  | "backwards"
  | "network-protocols"
  | "ai-arcade"
  | "it-project-simulator"
  | "python-java-types"
  | "os-components"
  | "media-access"
  | "media-access-test"
  | "digital-info"
  | "database-lesson"
  | "tcpip-addresses"
  | "linear-programs"
  | "code-duel"
  | "sets-python-js"
  | "os-processes";

interface CategoryItem {
  key: CategoryKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
}

interface TrainerItem {
  key: TrainerKey;
  category: CategoryKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
  paid?: boolean;
}

const IFRAME_SRC: Partial<Record<TrainerKey, string>> = {
  "ai-arcade": "/ai-arcade.html",
  "it-project-simulator": "/it-project-simulator.html",
  "python-java-types": "/python-java-types.html",
  "os-components": "/os-components.html",
  "os-processes": "/os-processes.html",
  "media-access": "/media-access-methods.html",
  "media-access-test": "/media-access-test.html",
  "digital-info": "/computer-digital-info.html",
  "database-lesson": "/database-lesson.html",
  "tcpip-addresses": "/tcpip-addresses.html",
  "linear-programs": "/linear-programs.html",
  "code-duel": "/code-duel.html",
  "sets-python-js": "/sets-python-js.html",
};

const CATEGORIES: CategoryItem[] = [
  {
    key: "informatics",
    icon: "📚",
    title: "Информатика",
    description: "Работа с информацией, представление данных, базы данных, нейросети",
    accent: "#2563EB",
  },
  {
    key: "networks",
    icon: "🌐",
    title: "Компьютерные сети",
    description: "Протоколы, методы доступа к среде передачи, адресация TCP/IP",
    accent: "#0891B2",
  },
  {
    key: "programming",
    icon: "🧩",
    title: "Алгоритмизация и программирование",
    description: "Алгоритмы, типы данных, линейные программы, игры и соревнования по коду",
    accent: "#16A34A",
  },
  {
    key: "os",
    icon: "🖥️",
    title: "Операционные системы и среды",
    description: "Устройство и компоненты операционных систем",
    accent: "#8B5CF6",
  },
];

const TRAINERS: TrainerItem[] = [
  {
    key: "info-basics",
    category: "informatics",
    icon: "📚",
    title: "Работа с информацией",
    description: "Тест, классификация, сопоставление и обработчик текста — один интерактив в 4 шага",
    accent: "#2563EB",
  },
  {
    key: "algorithms",
    category: "programming",
    icon: "🧩",
    title: "Алгоритмические конструкции",
    description: "Теория и тест по линейным алгоритмам, ветвлению, циклам",
    accent: "#16A34A",
  },
  {
    key: "backwards",
    category: "programming",
    icon: "🧠",
    title: "Анализ с конца",
    description: "Логические задачи на монеты, яблоки и улитку с решением и псевдокодом",
    accent: "#0EA5E9",
    paid: true,
  },
  {
    key: "network-protocols",
    category: "networks",
    icon: "🌐",
    title: "Сетевые протоколы",
    description: "Теория по модели OSI и TCP/IP, тест и именной сертификат по итогам",
    accent: "#0891B2",
  },
  {
    key: "ai-arcade",
    category: "informatics",
    icon: "🤖",
    title: "AI Arcade: Архитектура нейросети",
    description: "Аркада на 5 уровней про сбор данных, обучение весов и архитектуру нейросети — с сертификатом",
    accent: "#ff00e6",
    paid: true,
  },
  {
    key: "it-project-simulator",
    category: "informatics",
    icon: "🚀",
    title: "IT Project Simulator",
    description: "Командная игра по управлению IT-проектами: 4 кризисных этапа, оценка решений и лидерборд",
    accent: "#3B82F6",
    paid: true,
  },
  {
    key: "python-java-types",
    category: "programming",
    icon: "💻",
    title: "Типы данных: Python и Java",
    description: "Теория, 9 практических заданий и именной сертификат по теме «Типы данных»",
    accent: "#F59E0B",
    paid: true,
  },
  {
    key: "os-components",
    category: "os",
    icon: "🖥️",
    title: "Функциональные компоненты ОС",
    description: "Урок из 8 разделов про ядро, процессы, память и файловые системы, тест на 10 вопросов и сертификат",
    accent: "#8B5CF6",
  },
  {
    key: "os-processes",
    category: "os",
    icon: "⚙️",
    title: "Управление процессами",
    description: "Теория про состояния, планирование и тупики, разбор вывода ps и top, тест на 10 вопросов и сертификат",
    accent: "#667eea",
  },
  {
    key: "media-access",
    category: "networks",
    icon: "🔌",
    title: "Методы доступа к среде передачи",
    description: "Живая симуляция CSMA/CD, CSMA/CA и Token Ring: коллизии, маркер, статистика и лог событий",
    accent: "#14B8A6",
    paid: true,
  },
  {
    key: "media-access-test",
    category: "networks",
    icon: "📝",
    title: "Тест: методы доступа к сети",
    description: "9 заданий на 13 баллов: выбор ответа, соответствие и ситуационная задача с разбором и оценкой",
    accent: "#0369A1",
    paid: true,
  },
  {
    key: "digital-info",
    category: "informatics",
    icon: "💻",
    title: "Компьютер и цифровая информация",
    description: "Урок из 10 шагов: двоичный конвертер, пиксельный редактор, схема ПК и именной сертификат",
    accent: "#7C5CFC",
  },
  {
    key: "database-lesson",
    category: "informatics",
    icon: "🗄️",
    title: "Создание базы данных",
    description: "Урок из 12 шагов: виды БД, кликабельная схема «Библиотека», SQL-запросы, практика и сертификат",
    accent: "#2563EB",
  },
  {
    key: "tcpip-addresses",
    category: "networks",
    icon: "🌐",
    title: "Типы адресов стека TCP/IP",
    description: "Теория, симулятор командной строки (ipconfig, ping, netstat), тест на 10 вопросов и сертификат",
    accent: "#1E3C72",
    paid: true,
  },
  {
    key: "linear-programs",
    category: "programming",
    icon: "🎓",
    title: "Практическая работа: программы линейной структуры",
    description: "Теория, 6 заданий по уровням Блума, тест на 10 вопросов, самооценка и именной сертификат",
    accent: "#764ba2",
    paid: true,
  },
  {
    key: "code-duel",
    category: "programming",
    icon: "🎮",
    title: "Кодовая Дуэль: линейные программы",
    description: "Дуэль на двоих с таймером, бонусами за скорость, шутками и именным сертификатом победителя",
    accent: "#ff00ff",
    paid: true,
  },
  {
    key: "sets-python-js",
    category: "programming",
    icon: "🧮",
    title: "Множества: Python и JavaScript",
    description: "Теория с параллельным сравнением двух языков, 10 практических заданий, тест, игра на 3 команды и рефлексия",
    accent: "#4facfe",
    paid: true,
  },
];

/* ---------- Страница ---------- */

const StudentTrainer = () => {
  const { user, isPaid } = useAuth();
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [active, setActive] = useState<TrainerKey | null>(null);
  const activeTrainer = TRAINERS.find((t) => t.key === active);
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
        onOpenPricing={() => setProfileOpen(true)}
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

          {!category ? (
            <>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-coral">Для учеников</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
                  <span className="text-3xl">🧠</span> Тренажёры для учеников
                </h1>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Выберите раздел — внутри тесты, игры, симуляторы и практические работы прямо в
                  браузере.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {CATEGORIES.map((c, i) => {
                  const count = TRAINERS.filter((t) => t.category === c.key).length;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className="group relative text-left rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${c.accent}1A` }}
                      >
                        {c.icon}
                      </div>
                      <h3 className="font-display font-bold text-lg mb-1.5">{c.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {c.description}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1"
                        style={{ color: c.accent }}
                      >
                        {count} {count === 1 ? "тренажёр" : count < 5 ? "тренажёра" : "тренажёров"}
                        <Icon name="ArrowRight" size={15} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : !active ? (
            <>
              <button
                onClick={() => setCategory(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <Icon name="ArrowLeft" size={15} />
                Все разделы
              </button>

              <div className="max-w-2xl mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
                  <span className="text-2xl">{CATEGORIES.find((c) => c.key === category)?.icon}</span>
                  {CATEGORIES.find((c) => c.key === category)?.title}
                </h1>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TRAINERS.filter((t) => t.category === category).map((t, i) => {
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
                Назад к разделу
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
              ) : (
                <TrainerFullscreen
                  icon={activeTrainer?.icon || ""}
                  title={activeTrainer?.title || ""}
                  onClose={() => setActive(null)}
                >
                  {IFRAME_SRC[active] ? (
                    <iframe
                      key={active}
                      src={IFRAME_SRC[active]}
                      title={activeTrainer?.title}
                      className="block h-full w-full border-0"
                    />
                  ) : (
                    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
                      {active === "info-basics" && <InfoBasicsInteractive />}
                      {active === "algorithms" && <AlgorithmsTask />}
                      {active === "backwards" && <BackwardsAnalysisTask />}
                      {active === "network-protocols" && <NetworkProtocolsTask />}
                    </div>
                  )}
                </TrainerFullscreen>
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