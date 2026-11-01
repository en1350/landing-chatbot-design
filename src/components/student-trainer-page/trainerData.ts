/* ---------- Список тренажёров ---------- */

export type CategoryKey = "informatics" | "networks" | "programming" | "os" | "ege" | "ovz" | "hardware" | "code";

export type TrainerKey =
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
  | "osi-tcpip-models"
  | "linear-programs"
  | "code-duel"
  | "sets-python-js"
  | "os-processes"
  | "os-memory"
  | "data-analysis-ai"
  | "binary-search"
  | "linear-complexity"
  | "quadratic-complexity"
  | "set-theory"
  | "internet-ai"
  | "information-security"
  | "lists-graphs-trees"
  | "modeling-luntik"
  | "multimedia-slide-ovz"
  | "executor-algorithms-ovz"
  | "number-systems-ovz"
  | "ege-divisibility"
  | "ege-sound-channel"
  | "ege-nonary-numbers"
  | "ege-robot-coins"
  | "pc-builder"
  | "js-browser-vs-node"
  | "python-js-simulator"
  | "html-css-js-simulator"
  | "hash-tables";

export interface CategoryItem {
  key: CategoryKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
}

export interface TrainerItem {
  key: TrainerKey;
  category: CategoryKey;
  icon: string;
  title: string;
  description: string;
  accent: string;
  paid?: boolean;
}

export const ASSET_VERSION = "20261029c";

export const IFRAME_SRC: Partial<Record<TrainerKey, string>> = {
  "ip-diagnostics": "/ip-diagnostics.html",
  "subnet-calculator": "/subnet-calculator.html",
  "lan-simulator": "/lan-simulator.html",
  "branching-programs": "/branching-programs.html",
  "ai-arcade": "/ai-arcade.html",
  "it-project-simulator": "/it-project-simulator.html",
  "python-java-types": "/python-java-types.html",
  "os-components": "/os-components.html",
  "os-processes": "/os-processes.html",
  "os-memory": "/os-memory.html",
  "media-access": "/media-access-methods.html",
  "media-access-test": "/media-access-test.html",
  "digital-info": "/computer-digital-info.html",
  "database-lesson": "/database-lesson.html",
  "text-processors": "/text-processors.html",
  "tcpip-addresses": "/tcpip-addresses.html",
  "network-equipment": "/network-equipment.html",
  "osi-tcpip-models": "/osi-tcpip-models.html",
  "linear-programs": "/linear-programs.html",
  "code-duel": "/code-duel.html",
  "sets-python-js": "/sets-python-js.html",
  "data-analysis-ai": "/data-analysis-ai.html",
  "binary-search": "/binary-search.html",
  "linear-complexity": "/linear-complexity.html",
  "quadratic-complexity": "/quadratic-complexity.html",
  "set-theory": "/set-theory.html",
  "internet-ai": "/internet-ai.html",
  "information-security": "/information-security.html",
  "lists-graphs-trees": "/lists-graphs-trees.html",
  "modeling-luntik": "/modeling-luntik.html",
  "multimedia-slide-ovz": "/multimedia-slide-ovz.html",
  "executor-algorithms-ovz": "/executor-algorithms-ovz.html",
  "number-systems-ovz": "/number-systems-ovz.html",
  "ege-divisibility": "/ege-divisibility.html",
  "ege-sound-channel": "/ege-sound-channel.html",
  "ege-nonary-numbers": "/ege-nonary-numbers.html",
  "ege-robot-coins": "/ege-robot-coins.html",
  "pc-builder": "/pc-builder.html",
  "js-browser-vs-node": "/js-browser-vs-node.html",
  "python-js-simulator": "/python-js-simulator.html",
  "html-css-js-simulator": "/html-css-js-simulator.html",
  "hash-tables": "/hash-tables.html",
};

export const CATEGORIES: CategoryItem[] = [
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

export const TRAINERS: TrainerItem[] = [
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
    key: "hash-tables",
    category: "programming",
    icon: "🧮",
    title: "Хеш-таблицы (Python и JS)",
    description: "Теория с аналогией из жизни, симуляция вставки в бакеты с журналом действий, примеры на Python и JavaScript, тест на 5 вопросов и именной сертификат",
    accent: "#2563EB",
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
    key: "information-security",
    category: "informatics",
    icon: "🛡️",
    title: "Информационная безопасность",
    description: "Теория о CIA-триаде, угрозах и методах защиты, анализатор паролей, пример фишинга, 5 практических заданий, тест на 10 вопросов, рефлексия и разбор ошибок",
    accent: "#1e40af",
  },
  {
    key: "lists-graphs-trees",
    category: "informatics",
    icon: "🌳",
    title: "Списки, графы, деревья",
    description: "Теория о структурах данных, конструктор графов и деревьев на холсте, 10 практических заданий, тест на 10 вопросов, рефлексия и разбор ошибок",
    accent: "#2563eb",
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
    key: "number-systems-ovz",
    category: "ovz",
    icon: "🔢",
    title: "Системы счисления (для ОВЗ)",
    description: "Доступная версия: теория, калькулятор перевода между системами, 8 заданий, тест на 5 вопросов, озвучивание, высокий контраст, шрифт для дислексии, сертификат",
    accent: "#0056b3",
    paid: true,
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
    key: "os-memory",
    category: "os",
    icon: "🧠",
    title: "Управление памятью",
    description: "Фрагментация, страничная организация, TLB и виртуальная память: теория, симулятор выделения памяти, 8 задач, итоговый тест и сертификат",
    accent: "#3b82f6",
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
    key: "osi-tcpip-models",
    category: "networks",
    icon: "🌐",
    title: "Сетевые модели OSI и TCP/IP",
    description: "Теория про 7 уровней OSI и 4 уровня TCP/IP, анимация прохождения данных, сопоставление протоколов, тест на 10 вопросов и сертификат",
    accent: "#4F46E5",
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

export const getSolvedCount = (key: TrainerKey): number | null => {
  if (key !== "ege-divisibility") return null;
  try {
    return Number(localStorage.getItem("ege_divisibility_solved") || 0);
  } catch {
    return 0;
  }
};
