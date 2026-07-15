import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Ссылка недействительна: отсутствует токен");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сбросить пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon name="KeyRound" size={18} />
          </span>
          <h1 className="font-display text-lg font-bold">Новый пароль</h1>
        </div>

        {success ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm flex gap-2.5">
            <Icon name="CheckCircle2" size={18} className="text-primary shrink-0 mt-0.5" />
            <span>Пароль обновлён! Переносим вас на главную страницу...</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новый пароль (от 6 символов)"
            />
            <Input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Повторите пароль"
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
                  Сохраняю...
                </>
              ) : (
                "Сохранить новый пароль"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
