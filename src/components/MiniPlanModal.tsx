import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MiniPlanPanel from "@/components/MiniPlanPanel";

interface MiniPlanModalProps {
  open: boolean;
  onClose: () => void;
}

const MiniPlanModal = ({ open, onClose }: MiniPlanModalProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-display">
          <span className="text-2xl">✨</span> Мини-конструктор урока
        </DialogTitle>
        <DialogDescription>Быстрый план занятия от ИИ — бесплатно</DialogDescription>
      </DialogHeader>
      <MiniPlanPanel />
    </DialogContent>
  </Dialog>
);

export default MiniPlanModal;
