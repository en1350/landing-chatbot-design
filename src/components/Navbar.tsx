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

interface NavbarProps {
  onOpenNotebook: () => void;
  onOpenDecomposer: () => void;
  onOpenRandomizer: () => void;
  onOpenAntiplagiat: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
}

const NAV_LINKS = [
  { label: "Декомпозитор компетенций", key: "decomposer", icon: "Network" },
  { label: "Рандомайзер", key: "randomizer", icon: "Shuffle" },
  { label: "Антиплагиат", key: "antiplagiat", icon: "ShieldCheck" },
];

const QUICK_LINKS = [
  { label: "Конструктор урока", to: "/konstruktor-uroka", icon: "BookOpen" },
  { label: "Конструктор заданий", to: "/konstruktor-zadaniy", icon: "ClipboardList" },
  { label: "Презентации", to: "/generator-prezentaciy", icon: "Presentation" },
  { label: "Конструктор игры", to: "/konstruktor-igry", icon: "Gamepad2" },
];

const MORE_LINKS = [
  { label: "Тренажёр для учеников", to: "/trenazher-dlya-uchenikov", icon: "Brain" },
  { label: "Рабочие листы", to: "/konstruktor-rabochih-listov", icon: "FileText" },
  { label: "Рабочие программы", to: "/konstruktor-rabochih-programm", icon: "BookMarked" },
  { label: "Генератор проектов", to: "/generator-proektov", icon: "FolderKanban" },
  { label: "Мастер-классы", to: "/konstruktor-masterklassov", icon: "Sparkles" },
  { label: "Задания по ПМ", to: "/generator-zadaniy-pm", icon: "Briefcase" },
  { label: "Аналитика качества", to: "/analitika-kachestva", icon: "BarChart3" },
  { label: "Внеаудиторная деятельность", to: "/vneauditornaya-deyatelnost", icon: "Users" },
  { label: "Матрица технологий обучения", to: "/matritsa-tehnologiy", icon: "Grid3x3" },
  { label: "Проектная деятельность", to: "/proektnaya-deyatelnost", icon: "FlaskConical" },
  { label: "Коррекционная работа", to: "/korrektsionnaya-rabota", icon: "MessageCircle" },
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

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <button
              key={l.key}
              onClick={() => handleClick(l.key)}
              className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {l.label}
            </button>
          ))}
          <Link
            to="/konstruktor-uroka"
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Конструктор урока
          </Link>
          <Link
            to="/konstruktor-zadaniy"
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Конструктор заданий
          </Link>
          <Link
            to="/konstruktor-igry"
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Конструктор игры
          </Link>
          <Link
            to="/trenazher-dlya-uchenikov"
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Тренажёр для учеников
          </Link>
          <button
            onClick={onOpenNotebook}
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Проверка тетради
          </button>
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

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={user ? onOpenProfile : onOpenAuth} className="gap-1.5">
            <Icon name={user ? "User" : "LogIn"} size={16} />
            {user ? "Кабинет" : "Войти"}
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors">
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

            <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Популярное</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[88px] flex-col items-start justify-between rounded-xl border border-border bg-card p-3 hover:bg-accent transition-colors"
                >
                  <Icon name={q.icon} size={22} className="text-primary" />
                  <span className="text-sm font-semibold leading-tight">{q.label}</span>
                </Link>
              ))}
            </div>

            <p className="mt-6 mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Инструменты</p>
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => handleClick(l.key)}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg text-left text-base font-medium hover:bg-accent transition-colors"
                >
                  <Icon name={l.icon} size={18} className="text-muted-foreground" />
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenNotebook();
                }}
                className="flex items-center gap-3 px-2 py-3 rounded-lg text-left text-base font-medium hover:bg-accent transition-colors"
              >
                <Icon name="NotebookPen" size={18} className="text-muted-foreground" />
                Проверка тетради
              </button>
            </div>

            <p className="mt-6 mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Ещё</p>
            <div className="flex flex-col">
              {MORE_LINKS.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors"
                >
                  <Icon name={m.icon} size={18} className="text-muted-foreground" />
                  {m.label}
                </Link>
              ))}
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