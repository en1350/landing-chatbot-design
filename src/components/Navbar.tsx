import { useEffect, useState } from "react";
import { adminGet } from "@/lib/adminApi";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useChatUnread } from "@/hooks/use-chat-unread";
import NavDropdown, { NavItem } from "@/components/NavDropdown";

interface NavbarProps {
  onOpenNotebook: () => void;
  onOpenDecomposer: () => void;
  onOpenRandomizer: () => void;
  onOpenAntiplagiat: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
}

const GENERATORS_MENU: NavItem[] = [
  { label: "Конструктор рабочих программ", to: "/konstruktor-rabochih-programm", icon: "BookMarked" },
  { label: "Конструктор урока", to: "/konstruktor-uroka", icon: "BookOpen" },
  { label: "Конструктор заданий", to: "/konstruktor-zadaniy", icon: "ClipboardList" },
  { label: "Рабочие листы", to: "/konstruktor-rabochih-listov", icon: "FileText" },
  { label: "Презентации", to: "/generator-prezentaciy", icon: "Presentation" },
  { label: "Конструктор игры", to: "/konstruktor-igry", icon: "Gamepad2" },
  { label: "Мастер-классы", to: "/konstruktor-masterklassov", icon: "Sparkles" },
  { label: "Задания по ПМ", to: "/generator-zadaniy-pm", icon: "Briefcase" },
  { label: "Генератор проектов", to: "/generator-proektov", icon: "FolderKanban" },
];

const REPORTS_MENU: NavItem[] = [
  { label: "Качество обученности", to: "/analitika-kachestva", icon: "BarChart3" },
  { label: "Качественный анализ по предметам", to: "/kachestvo-znaniy", icon: "TrendingUp" },
  { label: "Внеаудиторная деятельность", to: "/vneauditornaya-deyatelnost", icon: "Users" },
  { label: "Матрица технологий обучения", to: "/matritsa-tehnologiy", icon: "Grid3x3" },
  { label: "Проектная деятельность", to: "/proektnaya-deyatelnost", icon: "FlaskConical" },
  { label: "Коррекционная работа", to: "/korrektsionnaya-rabota", icon: "MessageCircle" },
];

const TRAINERS_MENU: NavItem[] = [
  { label: "Все тренажёры", to: "/trenazher-dlya-uchenikov", icon: "Brain" },
  { label: "Информатика", to: "/trenazher-dlya-uchenikov?cat=informatics", icon: "BookOpen" },
  { label: "Компьютерные сети", to: "/trenazher-dlya-uchenikov?cat=networks", icon: "Network" },
  { label: "Программирование", to: "/trenazher-dlya-uchenikov?cat=programming", icon: "Code" },
  { label: "Операционные системы", to: "/trenazher-dlya-uchenikov?cat=os", icon: "Monitor" },
];

const Navbar = ({
  onOpenNotebook,
  onOpenDecomposer,
  onOpenRandomizer,
  onOpenAntiplagiat,
  onOpenProfile,
  onOpenAuth,
  onOpenPricing,
}: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user, token } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const chatUnread = useChatUnread();

  useEffect(() => {
    if (!user || !token) {
      setIsAdmin(false);
      return;
    }
    adminGet("check", token)
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, [user, token]);

  const handleClick = (key: string) => {
    setOpen(false);
    if (key === "decomposer") onOpenDecomposer();
    if (key === "randomizer") onOpenRandomizer();
    if (key === "antiplagiat") onOpenAntiplagiat();
    if (key === "pricing") onOpenPricing();
  };

  const extraMenu: NavItem[] = [
    { label: "Декомпозитор компетенций", icon: "Network", onClick: () => handleClick("decomposer") },
    { label: "Рандомайзер", icon: "Shuffle", onClick: () => handleClick("randomizer") },
    { label: "Антиплагиат", icon: "ShieldCheck", onClick: () => handleClick("antiplagiat") },
    { label: "Проверка тетради", icon: "NotebookPen", onClick: () => { setOpen(false); onOpenNotebook(); } },
    { label: "Игра «Педагогический ряд»", icon: "Gamepad2", href: "/pedagogical-row.html" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon name="GraduationCap" size={19} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Урок<span className="text-coral">АИ</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-0.5">
          <NavDropdown label="Генераторы для педагога" shortLabel="Генераторы" items={GENERATORS_MENU} />
          <NavDropdown label="Аналитические справки для портфолио" shortLabel="Справки" items={REPORTS_MENU} />
          <NavDropdown label="Тренажёры для учеников" shortLabel="Тренажёры" items={TRAINERS_MENU} />
          <NavDropdown label="Дополнительные сервисы" shortLabel="Сервисы" items={extraMenu} />
          {user && (
            <Link
              to="/chat"
              className="story-link relative px-3 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Чат
              {chatUnread > 0 && (
                <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-coral-foreground animate-pulse-soft">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="story-link px-3 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Админка
            </Link>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={user ? onOpenProfile : onOpenAuth} className="gap-1.5">
            <Icon name={user ? "User" : "LogIn"} size={16} />
            {user ? "Кабинет" : "Войти"}
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors">
              <Icon name="Menu" size={22} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-4">
            <SheetTitle className="font-display">Меню</SheetTitle>

            <button
              onClick={() => {
                setOpen(false);
                user ? onOpenProfile() : onOpenAuth();
              }}
              className="mt-4 flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground font-semibold"
            >
              <Icon name={user ? "User" : "LogIn"} size={20} />
              {user ? "Личный кабинет" : "Войти"}
            </button>

            {[
              { title: "Генераторы для педагога", items: GENERATORS_MENU },
              { title: "Аналитические справки для портфолио", items: REPORTS_MENU },
              { title: "Тренажёры для учеников", items: TRAINERS_MENU },
              { title: "Дополнительные сервисы", items: extraMenu },
            ].map((group) => (
              <div key={group.title}>
                <p className="mt-6 mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.title}</p>
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const cls = "flex items-center gap-3 px-2 py-3 rounded-lg text-left text-base font-medium hover:bg-accent transition-colors";
                    const body = (
                      <>
                        <Icon name={item.icon} size={18} className="text-muted-foreground" />
                        {item.label}
                      </>
                    );
                    if (item.to)
                      return (
                        <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className={cls}>
                          {body}
                        </Link>
                      );
                    if (item.href)
                      return (
                        <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={cls}>
                          {body}
                        </a>
                      );
                    return (
                      <button key={item.label} onClick={item.onClick} className={cls}>
                        {body}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-6 flex flex-col">
              {user && (
                <Link
                  to="/chat"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg text-base font-semibold text-primary hover:bg-accent transition-colors"
                >
                  <Icon name="MessagesSquare" size={18} />
                  Чат педагогов
                  {chatUnread > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-bold text-coral-foreground">
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  )}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg text-base font-semibold text-primary hover:bg-accent transition-colors"
                >
                  <Icon name="Shield" size={18} />
                  Админка
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;