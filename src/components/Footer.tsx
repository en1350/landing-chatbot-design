import Icon from "@/components/ui/icon";

interface FooterProps {
  onOpenProfile: () => void;
}

const Footer = ({ onOpenProfile }: FooterProps) => {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="container py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="GraduationCap" size={16} />
            </span>
            <span className="font-display font-bold">
              Урок<span className="text-coral">АИ</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            ИИ-помощник, который экономит время педагога на подготовку и проверку.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Сервис</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#generators" className="hover:text-foreground transition-colors">Генераторы</a></li>
            <li><a href="#notebook" className="hover:text-foreground transition-colors">Проверка тетради</a></li>
            <li><a href="#pricing" className="hover:text-foreground transition-colors">Тарифы</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Аккаунт</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <button onClick={onOpenProfile} className="hover:text-foreground transition-colors">
                Личный кабинет
              </button>
            </li>
            <li>
              <button onClick={onOpenProfile} className="hover:text-foreground transition-colors">
                Политика данных
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Контакты</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="mailto:urokru@bot-flow.ru" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <Icon name="Mail" size={14} />
                urokru@bot-flow.ru
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} УрокАИ. Все права защищены.
        </p>
      </div>
    </footer>
  );
};

export default Footer;