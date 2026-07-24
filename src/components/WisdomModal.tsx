import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { getQuoteOfTheDay } from "@/data/wisdomQuotes";

interface WisdomModalProps {
  open: boolean;
  onClose: () => void;
}

const WisdomModal = ({ open, onClose }: WisdomModalProps) => {
  const quote = getQuoteOfTheDay();
  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">💡</span> Мудрая минутка
          </DialogTitle>
          <DialogDescription>Педагогическая мысль на {today}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
          <Icon name="Quote" size={26} className="mx-auto text-primary mb-3" />
          <p className="font-display text-lg font-semibold leading-relaxed text-balance">
            {quote}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WisdomModal;
