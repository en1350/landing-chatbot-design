import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "login" | "register" | "forgot";

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPrivacyAccepted(false);
    setError(null);
    setLoading(false);
    setForgotSent(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const switchMode = (m: Mode) => {
    setError(null);
    setForgotSent(null);
    setMode(m);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && !privacyAccepted) {
      setError("Необходимо согласиться с политикой обработки персональных данных");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        handleClose();
      } else if (mode === "register") {
        await register(email, password, name, privacyAccepted);
        handleClose();
      } else {
        const message = await forgotPassword(email);
        setForgotSent(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: "Вход в кабинет",
    register: "Регистрация",
    forgot: "Восстановление доступа",
  };

  const descriptions: Record<Mode, string> = {
    login: "Войдите, чтобы сохранять материалы и управлять подпиской",
    register: "Создайте аккаунт — это займёт меньше минуты",
    forgot: "Укажите email — пришлём ссылку для сброса пароля",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Icon name="UserCircle2" size={22} />
              {titles[mode]}
            </DialogTitle>
            <DialogDescription>{descriptions[mode]}</DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div className="space-y-4 mt-1">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm flex gap-2.5">
                <Icon name="MailCheck" size={18} className="text-primary shrink-0 mt-0.5" />
                <span>{forgotSent}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => switchMode("login")}>
                Вернуться ко входу
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 mt-1">
              {mode === "register" && (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              )}
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              {mode !== "forgot" && (
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль (от 6 символов)"
                />
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1"
                >
                  Забыли пароль?
                </button>
              )}

              {mode === "register" && (
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(v) => setPrivacyAccepted(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="privacy" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    Я согласен с{" "}
                    <button
                      type="button"
                      onClick={() => setPrivacyOpen(true)}
                      className="text-primary underline underline-offset-2"
                    >
                      политикой обработки персональных данных
                    </button>
                  </label>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11 gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    Секунду...
                  </>
                ) : mode === "login" ? (
                  "Войти"
                ) : mode === "register" ? (
                  "Создать аккаунт"
                ) : (
                  "Отправить ссылку"
                )}
              </Button>
            </form>
          )}

          {!forgotSent && (
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center mt-1"
            >
              {mode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
          )}
        </DialogContent>
      </Dialog>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
};

export default AuthModal;
