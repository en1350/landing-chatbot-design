import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

type Status = "loading" | "success" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setStatus("error");
      setError("Ссылка недействительна: отсутствует токен");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Не удалось подтвердить email");
      });
  }, [token, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon name="MailCheck" size={18} />
          </span>
          <h1 className="font-display text-lg font-bold">Подтверждение email</h1>
        </div>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm">
            <Icon name="Loader2" size={18} className="animate-spin" />
            Подтверждаем ваш email...
          </div>
        )}

        {status === "success" && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm flex gap-2.5">
            <Icon name="CheckCircle2" size={18} className="text-primary shrink-0 mt-0.5" />
            <span>Email подтверждён! Переносим вас на главную страницу...</span>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-destructive flex items-start gap-1.5">
              <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
            <Button className="w-full" onClick={() => navigate("/")}>
              На главную
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
