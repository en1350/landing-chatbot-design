import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

const IMAGE = "/rpd-instruction.jpg";

const RpdInstruction = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 overflow-hidden rounded-xl border border-border">
          <img src={IMAGE} alt="Инструкция по генерации рабочих документов с помощью ИИ" className="h-24 w-20 object-cover object-top" />
        </button>
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-display text-base font-bold mb-1">Инструкция по работе с конструктором</h2>
          <p className="text-sm text-muted-foreground">
            Шесть шагов: от названия дисциплины и ФГОС до календарно-тематического плана, КОС и учебно-методического пособия.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Icon name="BookOpen" size={16} />
          Открыть инструкцию
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Инструкция по генерации рабочих документов с помощью ИИ</DialogTitle>
          </DialogHeader>
          <img src={IMAGE} alt="Инструкция по генерации рабочих документов с помощью ИИ" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RpdInstruction;
