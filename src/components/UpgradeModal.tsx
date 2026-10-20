import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useAuth, AUTH_URL } from "@/context/AuthContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onNeedAuth: () => void;
}

type PlanKey = "single" | "month" | "quarter" | "year";

const PLAN_OPTIONS: { key: PlanKey; price: string; period: string; perMonth?: string; badge?: string }[] = [
  { key: "single", price: "17 ₽", period: "1 использование", perMonth: "разовая оплата" },
  { key: "month", price: "199 ₽", period: "1 месяц" },
  { key: "quarter", price: "477 ₽", period: "3 месяца", perMonth: "159 ₽ / мес" },
  { key: "year", price: "1668 ₽", period: "12 месяцев", perMonth: "139 ₽ / мес", badge: "Выгоднее на 30%" },
];

const UpgradeModal = ({ open, onClose, onNeedAuth }: UpgradeModalProps) => {
  const { token, refresh } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("year");
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setLoadingPlan(null);
    setError(null);
    setPaymentUrl(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pay = async (plan: PlanKey) => {
    if (!token) {
      onNeedAuth();
      return;
    }
    setError(null);
    setPaymentUrl(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "create_payment",
          plan,
          return_url: window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось создать платёж");

      if (data.payment_id) {
        localStorage.setItem("urokai_pending_payment", data.payment_id);
      }
      if (data.confirmation_url) {
        setPaymentUrl(data.confirmation_url);
        try {
          (window.top || window).location.href = data.confirmation_url;
        } catch {
          window.open(data.confirmation_url, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты, попробуйте снова");
    } finally {
      setLoadingPlan(null);
      refresh();
    }
  };

  const copyLink = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // игнорируем, если буфер обмена недоступен
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg text-center">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-3xl mb-2">
            🔓
          </div>
          <DialogTitle className="font-display text-xl">Доступно по оплате</DialogTitle>
          <DialogDescription>
            Оплатите одно использование за 17 ₽ или оформите подписку — оплата банковской картой через ЮКассу.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2" role="radiogroup" aria-label="Выбор тарифа">
          {PLAN_OPTIONS.map((p) => {
            const active = selectedPlan === p.key;
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedPlan(p.key)}
                disabled={loadingPlan !== null}
                className={`relative rounded-xl border-2 p-3 text-left transition-colors disabled:opacity-60 ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-coral text-coral-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon name="Check" size={11} />
                  </span>
                )}
                <p className="font-display text-xl font-bold">{p.price}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.period}</p>
                {p.perMonth && <p className="text-[11px] text-primary font-semibold mt-0.5">{p.perMonth}</p>}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center justify-center gap-1.5 mt-1">
            <Icon name="AlertCircle" size={14} />
            {error}
          </p>
        )}

        <Button
          onClick={() => pay(selectedPlan)}
          className="w-full h-11 mt-1 bg-primary hover:bg-primary/90 gap-2"
          disabled={loadingPlan !== null}
        >
          {loadingPlan ? (
            <>
              <Icon name="Loader2" size={17} className="animate-spin" />
              Переходим к оплате...
            </>
          ) : (
            <>
              <Icon name="CreditCard" size={17} />
              Оплатить {PLAN_OPTIONS.find((p) => p.key === selectedPlan)?.price} банковской картой
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">Безопасный платёж через ЮКассу</p>

        {paymentUrl && (
          <div className="rounded-xl border border-border bg-secondary/40 p-3.5 mt-2 text-left animate-fade-in">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Icon name="AlertTriangle" size={13} className="text-coral shrink-0" />
              Страница оплаты не открылась? Возможно, её блокирует VPN или блокировщик рекламы в браузере (часто встречается в Opera).
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
              >
                <Icon name="ExternalLink" size={14} />
                Открыть в новой вкладке
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyLink}>
                <Icon name={copied ? "Check" : "Copy"} size={14} />
                {copied ? "Скопировано" : "Скопировать ссылку"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;