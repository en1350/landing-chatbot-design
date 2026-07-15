import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

interface DecomposerModalProps {
  open: boolean;
  onClose: () => void;
}

interface Level {
  level: string;
  desc: string;
}

async function requestDecompose(competency: string): Promise<Level[]> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "decompose", competency }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось разложить компетенцию");
  return data.levels as Level[];
}

const DecomposerModal = ({ open, onClose }: DecomposerModalProps) => {
  const [competency, setCompetency] = useState("");
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setCompetency("");
    setLevels(null);
    setLoading(false);
    setError(null);
    onClose();
  };

  const decompose = async () => {
    if (!competency.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestDecompose(competency.trim());
      setLevels(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось разложить компетенцию, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🧩</span> Декомпозитор компетенций
          </DialogTitle>
          <DialogDescription>
            Разложите любую компетенцию на уровни освоения по таксономии Блума
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <Input
            value={competency}
            onChange={(e) => setCompetency(e.target.value)}
            placeholder="Например: работа с историческими источниками"
          />

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          <Button className="w-full h-11 gap-2 bg-primary hover:bg-primary/90" onClick={decompose} disabled={loading || !competency.trim()}>
            {loading ? (
              <>
                <Icon name="Loader2" size={17} className="animate-spin" />
                ИИ разбирает компетенцию...
              </>
            ) : (
              <>
                <Icon name="Layers" size={17} />
                Разложить на уровни
              </>
            )}
          </Button>

          {levels && (
            <div className="space-y-2.5 animate-fade-in max-h-72 overflow-y-auto pr-1">
              {levels.map((l, i) => (
                <div key={l.level} className="rounded-xl border border-border p-3.5 flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{l.level}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecomposerModal;
