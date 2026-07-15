import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

interface RandomizerModalProps {
  open: boolean;
  onClose: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const RandomizerModal = ({ open, onClose }: RandomizerModalProps) => {
  const [namesText, setNamesText] = useState("");
  const [groupSize, setGroupSize] = useState("4");
  const [groups, setGroups] = useState<string[][] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const names = namesText
    .split(/\n|,/)
    .map((n) => n.trim())
    .filter(Boolean);

  const reset = () => {
    setNamesText("");
    setGroupSize("4");
    setGroups(null);
    setChosen(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const makeGroups = () => {
    if (names.length === 0) return;
    const size = Math.max(2, parseInt(groupSize, 10) || 4);
    const shuffled = shuffle(names);
    const result: string[][] = [];
    for (let i = 0; i < shuffled.length; i += size) {
      result.push(shuffled.slice(i, i + size));
    }
    setGroups(result);
    setChosen(null);
  };

  const pickOne = () => {
    if (names.length === 0) return;
    setGroups(null);
    setChosen(shuffle(names)[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🎲</span> Рандомайзер
          </DialogTitle>
          <DialogDescription>
            Разбейте учеников на команды или выберите случайного отвечающего
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Список учеников</label>
            <Textarea
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder={"Каждое имя с новой строки или через запятую\nНапример: Аня, Борис, Вика..."}
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {names.length > 0 ? `Введено имён: ${names.length}` : "Введите хотя бы одно имя"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Размер команды</label>
              <Input
                type="number"
                min={2}
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full h-10 gap-2" onClick={makeGroups} disabled={names.length === 0}>
                <Icon name="Users" size={16} />
                Разбить на команды
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full h-10 gap-2" onClick={pickOne} disabled={names.length === 0}>
            <Icon name="Sparkles" size={16} />
            Выбрать одного случайно
          </Button>

          {chosen && (
            <div className="rounded-xl border-2 border-coral bg-coral/10 p-5 text-center animate-fade-in">
              <p className="text-xs text-muted-foreground mb-1">Отвечает</p>
              <p className="font-display text-2xl font-bold">{chosen}</p>
            </div>
          )}

          {groups && (
            <div className="space-y-2.5 animate-fade-in">
              {groups.map((g, i) => (
                <div key={i} className="rounded-xl border border-border p-3.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">
                    Команда {i + 1}
                  </p>
                  <p className="text-sm">{g.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RandomizerModal;
