import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useUsage } from "@/context/UsageContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const { setPaid } = useUsage();

  const activate = () => {
    setPaid(true);
    onClose();
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
            Оформите подписку — и генерации станут безлимитными для всех инструментов УрокАИ.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-xl border border-border p-4">
            <p className="font-display text-2xl font-bold">99 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">в месяц</p>
          </div>
          <div className="rounded-xl border-2 border-coral p-4 relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-coral text-coral-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              Выгоднее на 25%
            </span>
            <p className="font-display text-2xl font-bold">890 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">в год</p>
          </div>
        </div>

        <Button onClick={activate} className="w-full h-11 mt-3 bg-primary hover:bg-primary/90 gap-2">
          <Icon name="Sparkles" size={17} />
          Оформить подписку
        </Button>
        <p className="text-xs text-muted-foreground mt-1">Демо-режим: активация без оплаты</p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
