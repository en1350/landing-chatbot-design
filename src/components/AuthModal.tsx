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
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Icon name="UserCircle2" size={22} />
            {mode === "login" ? "Вход в кабинет" : "Регистрация"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Войдите, чтобы сохранять материалы и управлять подпиской"
              : "Создайте аккаунт — это займёт меньше минуты"}
          </DialogDescription>
        </DialogHeader>

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
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (от 6 символов)"
          />

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
            ) : (
              "Создать аккаунт"
            )}
          </Button>
        </form>

        <button
          onClick={() => {
            setError(null);
            setMode((m) => (m === "login" ? "register" : "login"));
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center mt-1"
        >
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
