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

type PlanKey = "month" | "year";

const UpgradeModal = ({ open, onClose, onNeedAuth }: UpgradeModalProps) => {
  const { token, refresh } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async (plan: PlanKey) => {
    if (!token) {
      onNeedAuth();
      return;
    }
    setError(null);
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
        window.location.href = data.confirmation_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты, попробуйте снова");
    } finally {
      setLoadingPlan(null);
      refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-3xl mb-2">
            🔓
          </div>
          <DialogTitle className="font-display text-xl">Бесплатный лимит исчерпан</DialogTitle>
          <DialogDescription>
            Оформите подписку — оплата банковской картой через ЮКассу.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => pay("month")}
            disabled={loadingPlan !== null}
            className="rounded-xl border border-border p-4 text-left hover:border-primary transition-colors disabled:opacity-60"
          >
            <p className="font-display text-2xl font-bold">99 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">в месяц</p>
          </button>
          <button
            onClick={() => pay("year")}
            disabled={loadingPlan !== null}
            className="rounded-xl border-2 border-coral p-4 relative text-left hover:bg-coral/5 transition-colors disabled:opacity-60"
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-coral text-coral-foreground text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              Выгоднее на 25%
            </span>
            <p className="font-display text-2xl font-bold">890 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">в год</p>
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center justify-center gap-1.5 mt-1">
            <Icon name="AlertCircle" size={14} />
            {error}
          </p>
        )}

        <Button
          onClick={() => pay("month")}
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
              Оплатить банковской картой
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">Безопасный платёж через ЮКассу</p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;