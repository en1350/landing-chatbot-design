import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { QRCodeSVG } from "qrcode.react";
import { useAuth, AUTH_URL } from "@/context/AuthContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onNeedAuth: () => void;
}

type PlanKey = "month" | "year";

const PLAN_LABELS: Record<PlanKey, string> = {
  month: "99 ₽ / месяц",
  year: "890 ₽ / год",
};

const UpgradeModal = ({ open, onClose, onNeedAuth }: UpgradeModalProps) => {
  const { token, refresh } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<PlanKey | null>(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const reset = () => {
    stopPolling();
    setLoadingPlan(null);
    setError(null);
    setQrData(null);
    setPaymentId(null);
    setActivePlan(null);
    setPaid(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const checkPayment = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ action: "check_payment", payment_id: id }),
      });
      const data = await res.json();
      if (res.ok && data.paid) {
        stopPolling();
        setPaid(true);
        refresh();
      }
    } catch {
      // игнорируем разовые сбои опроса
    }
  };

  const pay = async (plan: PlanKey) => {
    if (!token) {
      onNeedAuth();
      return;
    }
    setError(null);
    setLoadingPlan(plan);
    setQrData(null);
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
        setPaymentId(data.payment_id);
      }

      if (data.qr_data) {
        setQrData(data.qr_data);
        setActivePlan(plan);
        stopPolling();
        pollRef.current = setInterval(() => {
          if (data.payment_id) checkPayment(data.payment_id);
        }, 3000);
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        throw new Error("Не удалось получить QR-код для оплаты");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты, попробуйте снова");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md text-center">
        {paid ? (
          <div className="py-4 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
              ✅
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="font-display text-xl">Подписка активирована!</DialogTitle>
              <DialogDescription>Теперь вам доступна безлимитная генерация материалов.</DialogDescription>
            </DialogHeader>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90" onClick={handleClose}>
              Отлично!
            </Button>
          </div>
        ) : qrData ? (
          <div className="py-2 space-y-4">
            <DialogHeader className="items-center">
              <DialogTitle className="font-display text-xl">
                Оплата {activePlan && PLAN_LABELS[activePlan]}
              </DialogTitle>
              <DialogDescription>
                Отсканируйте QR-код камерой телефона или банковским приложением
              </DialogDescription>
            </DialogHeader>

            <div className="mx-auto flex aspect-square w-full max-w-56 items-center justify-center rounded-2xl border border-border bg-white p-3">
              <QRCodeSVG value={qrData} className="h-full w-full" />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Icon name="Loader2" size={15} className="animate-spin" />
              Ожидаем оплату...
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                stopPolling();
                setQrData(null);
                setActivePlan(null);
              }}
            >
              <Icon name="ArrowLeft" size={14} />
              Выбрать другой тариф
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/15 text-3xl mb-2">
                🔓
              </div>
              <DialogTitle className="font-display text-xl">Бесплатный лимит исчерпан</DialogTitle>
              <DialogDescription>
                Оформите подписку — отсканируйте QR-код и оплатите картой или через СБП (ЮКасса).
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
                  Генерируем QR-код...
                </>
              ) : (
                <>
                  <Icon name="QrCode" size={17} />
                  Оплатить по QR-коду
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Безопасный платёж через ЮКассу</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;