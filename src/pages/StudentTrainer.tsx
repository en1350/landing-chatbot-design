import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import AlgorithmsTask from "@/components/student-trainer/AlgorithmsTask";
import BackwardsAnalysisTask from "@/components/student-trainer/BackwardsAnalysisTask";
import NetworkProtocolsTask from "@/components/student-trainer/NetworkProtocolsTask";
import { reachGoal } from "@/lib/metrika";
import TrainerFullscreen from "@/components/student-trainer/TrainerFullscreen";

/* ---------- Список тренажёров ---------- */

type CategoryKey = "informatics" | "networks" | "programming" | "os" | "ege" | "ovz" | "hardware" | "code";

type TrainerKey =
  | "algorithms"
  | "backwards"
  | "network-protocols"
  | "ip-diagnostics"
  | "subnet-calculator"
  | "lan-simulator"
  | "branching-programs"
  | "ai-arcade"
  | "it-project-simulator"
  | "python-java-types"
  | "os-components"
  | "media-access"
  | "media-access-test"
  | "digital-info"
  | "database-lesson"
  | "text-processors"
  | "tcpip-addresses"
  | "network-equipment"
  | "linear-programs"
  | "code-duel"
  | "sets-python-js"
  | "os-processes"
  | "data-analysis-ai"
  | "binary-search"
  | "linear-complexity"
  | "quadratic-complexity"
  | "set-theory"
  | "internet-ai"
  | "modeling-luntik"
  | "multimedia-slide-ovz"
  | "executor-algorithms-ovz"
  | "ege-divisibility"
  | "ege-sound-channel"
  | "ege-nonary-numbers"
  | "ege-robot-coins"
  | "pc-builder"
  | "js-browser-vs-node"
  | "python-js-simulator"
  | "html-css-js-simulator";

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

const ASSET_VERSION = "20261024e";

const IFRAME_SRC: Partial<Record<TrainerKey, string>> = {
  "ip-diagnostics": "/ip-diagnostics.html",
  "subnet-calculator": "/subnet-calculator.html",
  "lan-simulator": "/lan-simulator.html",
  "branching-programs": "/branching-programs.html",
  "ai-arcade": "/ai-arcade.html",
  "it-project-simulator": "/it-project-simulator.html",
  "python-java-types": "/python-java-types.html",
  "os-components": "/os-components.html",
  "os-processes": "/os-processes.html",
  "media-access": "/media-access-methods.html",
  "media-access-test": "/media-access-test.html",
  "digital-info": "/computer-digital-info.html",
  "database-lesson": "/database-lesson.html",
  "text-processors": "/text-processors.html",
  "tcpip-addresses": "/tcpip-addresses.html",
  "network-equipment": "/network-equipment.html",
  "linear-programs": "/linear-programs.html",
  "code-duel": "/code-duel.html",
  "sets-python-js": "/sets-python-js.html",
  "data-analysis-ai": "/data-analysis-ai.html",
  "binary-search": "/binary-search.html",
  "linear-complexity": "/linear-complexity.html",
  "quadratic-complexity": "/quadratic-complexity.html",
  "set-theory": "/set-theory.html",
  "internet-ai": "/internet-ai.html",
  "modeling-luntik": "/modeling-luntik.html",
  "multimedia-slide-ovz": "/multimedia-slide-ovz.html",
  "executor-algorithms-ovz": "/executor-algorithms-ovz.html",
  "ege-divisibility": "/ege-divisibility.html",
  "ege-sound-channel": "/ege-sound-channel.html",
  "ege-nonary-numbers": "/ege-nonary-numbers.html",
  "ege-robot-coins": "/ege-robot-coins.html",
  "pc-builder": "/pc-builder.html",
  "js-browser-vs-node": "/js-browser-vs-node.html",
  "python-js-simulator": "/python-js-simulator.html",
  "html-css-js-simulator": "/html-css-js-simulator.html",
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
  {
    key: "ege",
    icon: "🎓",
    title: "ЕГЭ по информатике",
    description: "Разбор типовых заданий ЕГЭ с генерацией задач, проверкой ответа и счётчиком выполненных заданий",
    accent: "#F59E0B",
  },
  {
    key: "hardware",
    icon: "🖥️",
    title: "Архитектура аппаратных сред",
    description: "Устройство компьютера, комплектующие и их совместимость",
    accent: "#EC4899",
  },
  {
    key: "code",
    icon: "💻",
    title: "Симуляторы кода",
    description: "Пишите и запускайте код на Python и JavaScript прямо в браузере, сравнивайте среды выполнения",
    accent: "#6366F1",
  },
];

const TRAINERS: TrainerItem[] = [
  {
    key: "html-css-js-simulator",
    category: "code",
    icon: "🌐",
    title: "Симулятор: HTML + CSS + JavaScript",
    description: "Три редактора с подсветкой: HTML, CSS и JavaScript. Результат страницы сразу виден рядом, можно включить автообновление",
    accent: "#E44D26",
    paid: true,
  },
  {
    key: "python-js-simulator",
    category: "code",
    icon: "🖥️",
    title: "Симулятор кода: Python и JavaScript",
    description: "Два редактора с подсветкой синтаксиса: Python запускается прямо в браузере, JavaScript в родной среде. Пишите, запускайте и сравнивайте результат",
    accent: "#3776AB",
    paid: true,
  },
  {
    key: "js-browser-vs-node",
    category: "code",
    icon: "⚡",
    title: "JavaScript: Браузер vs Node.js",
    description: "Учебная эмуляция: запускайте один и тот же код в песочнице браузера и в эмуляторе Node.js с виртуальной файловой системой и сравнивайте, что доступно в каждой среде",
    accent: "#F0DB4F",
    paid: true,
  },
  {
    key: "pc-builder",
    category: "hardware",
    icon: "🖥️",
    title: "Сборка компьютера (PC Builder Pro)",
    description: "Подберите комплектующие под задачу: проверка совместимости сокета, памяти, блока питания и корпуса, оценка производительности и бюджета, авто-подбор",
    accent: "#EC4899",
  },
  {
    key: "modeling-luntik",
    category: "informatics",
    icon: "🌙",
    title: "Модели и моделирование",
    description: "Теория, 3 симуляции, 5 практических заданий, тест на 10 вопросов и сертификат с разбором ошибок",
    accent: "#9b59b6",
  },
  {
    key: "multimedia-slide-ovz",
    category: "ovz",
    icon: "🎬",
    title: "Мультимедиа на слайде (для ОВЗ)",
    description: "Инклюзивный урок: простая теория, тренажёр слайда, 4 задания, тест на 6 вопросов, озвучивание, режимы для слабовидящих, дальтоников и дислексии, сертификат",
    accent: "#2980b9",
    paid: true,
  },
  {
    key: "internet-ai",
    category: "informatics",
    icon: "🌐",
    title: "Интернет и ИИ",
    description: "Теория о сервисах интернета и ИИ, симуляторы DNS и промптов, квиз на 10 вопросов и цифровой сертификат с разбором ошибок",
    accent: "#00f0ff",
  },
  {
    key: "set-theory",
    category: "informatics",
    icon: "📚",
    title: "Теория множеств",
    description: "Теория, диаграммы Эйлера-Венна, практика с операциями над множествами, тест, игра на 2 команды и сертификат",
    accent: "#667eea",
  },
  {
    key: "executor-algorithms-ovz",
    category: "ovz",
    icon: "🎯",
    title: "Исполнитель и алгоритмы (для ОВЗ)",
    description: "Доступная версия: свои числа для задачи, пошаговый пример решения, симулятор исполнителя, проверка ответа, озвучивание, контраст и шрифт для дислексии, сертификат",
    accent: "#27ae60",
    paid: true,
  },
  {
    key: "quadratic-complexity",
    category: "programming",
    icon: "📉",
    title: "Сложность алгоритма O(n²)",
    description: "Вложенные циклы на примере countPairs: визуализация сравнений, цена квадрата, разбор ошибки и мини-тест",
    accent: "#ff6b7a",
  },
  {
    key: "linear-complexity",
    category: "programming",
    icon: "📈",
    title: "Сложность алгоритма O(n)",
    description: "Анализ линейного прохода на примере findMax: теория, график роста, визуализация, разбор ошибок",
    accent: "#6c8cff",
  },
  {
    key: "binary-search",
    category: "programming",
    icon: "🔍",
    title: "Бинарный поиск",
    description: "Теория, визуализация алгоритма, практика с кодом, квест и сертификат",
    accent: "#38bdf8",
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
    key: "ip-diagnostics",
    category: "networks",
    icon: "🖧",
    title: "Симулятор: диагностика IP в ОС",
    description: "Командная строка Windows: ipconfig, ping и tracert, три практических задания с отметкой выполнения",
    accent: "#2B6CB0",
  },
  {
    key: "subnet-calculator",
    category: "networks",
    icon: "🧮",
    title: "Симулятор: разбиение на подсети",
    description: "Расчёт подсетей по IP и маске: таблица адресов, схема адресного пространства и пошаговое обоснование",
    accent: "#2C5282",
  },
  {
    key: "lan-simulator",
    category: "networks",
    icon: "🏢",
    title: "Симулятор ЛВС: офисная сеть",
    description: "Соберите схему сети на холсте: компьютеры, сервер, принтер, коммутатор, соединения и обоснование проекта для печати",
    accent: "#2B6CB0",
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
    key: "text-processors",
    category: "informatics",
    icon: "📝",
    title: "Обработка информации в текстовых процессорах",
    description: "Урок с теорией, 8 практических задач, 8 заданий на текстовую информацию, 3 симуляции, командная игра и рефлексия",
    accent: "#005B9F",
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
    key: "network-equipment",
    category: "networks",
    icon: "🔌",
    title: "Коммуникационное оборудование сетей",
    description: "Теория про хаб, коммутатор, маршрутизатор и межсетевой экран, симулятор «Собери сеть», тест на 10 вопросов и сертификат",
    accent: "#2C5364",
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
    key: "branching-programs",
    category: "programming",
    icon: "🔀",
    title: "Практическая работа: программы разветвляющей структуры",
    description: "Теория, 10 заданий на Python и JavaScript, тест на 15 вопросов с разбором ошибок и именной сертификат",
    accent: "#667EEA",
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
  {
    key: "data-analysis-ai",
    category: "informatics",
    icon: "📊",
    title: "Анализ данных с помощью ИИ",
    description: "Теория, 8 практических заданий, тест на 10 вопросов, аркадная игра и именной сертификат с разбором ошибок",
    accent: "#2a5298",
  },
  {
    key: "ege-divisibility",
    category: "ege",
    icon: "🎯",
    title: "Делимость и пары чисел",
    description: "Задача на последовательности: минимальное кратное 21, подходящие пары и максимальная сумма. Теория, пример, алгоритм и тренажёр",
    accent: "#F59E0B",
  },
  {
    key: "ege-sound-channel",
    category: "ege",
    icon: "🎵",
    title: "Звук и каналы связи",
    description: "Интерактивный разбор задачи: объём звукового файла, разрешение, частота дискретизации и время передачи. Меняйте условие ползунками",
    accent: "#F59E0B",
  },
  {
    key: "ege-nonary-numbers",
    category: "ege",
    icon: "🔢",
    title: "Девятеричные числа с ограничениями",
    description: "Разбор задачи на подсчёт девятеричных пятизначных чисел: две цифры 3 и нечётные цифры не рядом с 2. Пошаговое решение, симулятор перебора и проверка своего числа",
    accent: "#6366F1",
  },
  {
    key: "ege-robot-coins",
    category: "ege",
    icon: "🤖",
    title: "Робот и монеты: максимум и минимум",
    description: "Симулятор задачи про Робота на поле со стенами: заполняйте клетки, ставьте стены, находите максимальную и минимальную суммы и смотрите путь. Теория метода динамического программирования и импорт из Excel",
    accent: "#4F46E5",
  },
];

const getSolvedCount = (key: TrainerKey): number | null => {
  if (key !== "ege-divisibility") return null;
  try {
    return Number(localStorage.getItem("ege_divisibility_solved") || 0);
  } catch {
    return 0;
  }
};

/* ---------- Страница ---------- */

const StudentTrainer = () => {
  const { user, isPaid: planPaid, trainersUnlocked } = useAuth();
  const isPaid = planPaid || trainersUnlocked;
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const catParam = searchParams.get("cat");
  const trainerParam = searchParams.get("trainer");
  const [active, setActive] = useState<TrainerKey | null>(null);
  useEffect(() => {
    const found = CATEGORIES.find((c) => c.key === catParam);
    const direct = TRAINERS.find((t) => t.key === trainerParam);
    setCategory(found ? found.key : null);
    setActive(direct ? direct.key : null);
  }, [catParam, trainerParam]);
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
    reachGoal("trainer_started", { trainer: t.key, title: t.title });
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
        <div className="container py-6 sm:py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          {!category && !active ? (
            <>
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-coral">Для учеников</span>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 flex items-center gap-3">
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
                      {getSolvedCount(t.key) !== null && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 px-2.5 py-1 mb-3">
                          <Icon name="CheckCircle2" size={13} />
                          Выполнено заданий: {getSolvedCount(t.key)}
                        </span>
                      )}
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
                onClick={() => {
                  setActive(null);
                  if (trainerParam) setSearchParams({});
                }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <Icon name="ArrowLeft" size={15} />
                {category ? "Назад к разделу" : "Ко всем разделам"}
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
                      src={`${IFRAME_SRC[active]}?v=${ASSET_VERSION}`}
                      title={activeTrainer?.title}
                      className="block h-full w-full border-0"
                    />
                  ) : (
                    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
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