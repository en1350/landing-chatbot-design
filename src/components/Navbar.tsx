import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onOpenNotebook: () => void;
  onOpenTrainer: () => void;
  onOpenDecomposer: () => void;
  onOpenRandomizer: () => void;
  onOpenAntiplagiat: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
}

const NAV_LINKS = [
  { label: "Тренажёр", key: "trainer" },
  { label: "Декомпозитор компетенций", key: "decomposer" },
  { label: "Рандомайзер", key: "randomizer" },
  { label: "Антиплагиат", key: "antiplagiat" },
];

const Navbar = ({
  onOpenNotebook,
  onOpenTrainer,
  onOpenDecomposer,
  onOpenRandomizer,
  onOpenAntiplagiat,
  onOpenProfile,
  onOpenAuth,
  onOpenPricing,
}: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleClick = (key: string) => {
    setOpen(false);
    if (key === "trainer") onOpenTrainer();
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
          <button
            onClick={onOpenNotebook}
            className="story-link px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Проверка тетради
          </button>
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
          <SheetContent side="right" className="w-[85vw] max-w-72">
            <SheetTitle className="font-display">Меню</SheetTitle>
            <div className="mt-8 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => handleClick(l.key)}
                  className="text-left px-3 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  onOpenNotebook();
                }}
                className="text-left px-3 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors"
              >
                Проверка тетради
              </button>
              <div className="h-px bg-border my-2" />
              <button
                onClick={() => {
                  setOpen(false);
                  user ? onOpenProfile() : onOpenAuth();
                }}
                className="text-left px-3 py-3 rounded-lg text-base font-medium hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Icon name={user ? "User" : "LogIn"} size={18} />
                {user ? "Личный кабинет" : "Войти"}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;