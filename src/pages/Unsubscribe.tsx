import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const MAILING_URL = "https://functions.poehali.dev/0ecbd677-330a-4808-9ab2-dbbc21d157f7";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`${MAILING_URL}?unsubscribe=${encodeURIComponent(token)}`)
      .then((r) => setStatus(r.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {status === "loading" && (
          <>
            <Icon name="Loader2" size={32} className="mx-auto animate-spin text-muted-foreground" />
            <span className="sr-only">Отписка от рассылки УрокАИ…</span>
          </>
        )}
        {status === "ok" && (
          <>
            <Icon name="MailCheck" size={40} className="mx-auto mb-3 text-primary" />
            <h1 className="font-display text-xl font-bold mb-2">Вы отписаны от рассылки</h1>
            <p className="text-sm text-muted-foreground mb-5">Мы больше не будем присылать вам новости. Письма о работе личного кабинета продолжат приходить.</p>
          </>
        )}
        {status === "error" && (
          <>
            <Icon name="CircleAlert" size={40} className="mx-auto mb-3 text-destructive" />
            <h1 className="font-display text-xl font-bold mb-2">Ссылка недействительна</h1>
            <p className="text-sm text-muted-foreground mb-5">Возможно, она устарела или была скопирована не полностью.</p>
          </>
        )}
        {status !== "loading" && (
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;