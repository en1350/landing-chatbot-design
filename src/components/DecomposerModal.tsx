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
import { useAuth } from "@/context/AuthContext";
import { downloadTxt } from "@/lib/download";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

interface DecomposerModalProps {
  open: boolean;
  onClose: () => void;
  onNeedAuth: () => void;
  onNeedUpgrade: () => void;
}

interface Level {
  level: string;
  desc: string;
}

async function requestDecompose(competency: string, token: string | null): Promise<Level[]> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Authorization": token } : {}),
    },
    body: JSON.stringify({ action: "decompose", competency }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось разложить компетенцию");
  return data.levels as Level[];
}

const DecomposerModal = ({ open, onClose, onNeedAuth, onNeedUpgrade }: DecomposerModalProps) => {
  const { user, isPaid, token } = useAuth();
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
      const result = await requestDecompose(competency.trim(), token);
      setLevels(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось разложить компетенцию, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!levels) return;
    const lines = [
      `Декомпозиция компетенции: ${competency.trim()}`,
      "",
      ...levels.flatMap((l, i) => [`${i + 1}. ${l.level}`, l.desc, ""]),
    ];
    downloadTxt(`Декомпозиция — ${competency.trim()}`, lines);
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

        {!isPaid ? (
          <div className="mt-2 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
              🔒
            </div>
            <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Декомпозитор компетенций — премиум-инструмент. Оформите подписку, чтобы раскладывать
              любые компетенции на уровни таксономии Блума без ограничений.
            </p>
            <Button
              className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
              onClick={user ? onNeedUpgrade : onNeedAuth}
            >
              <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
              {user ? "Оформить подписку" : "Войти и оформить подписку"}
            </Button>
          </div>
        ) : (
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
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
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
                <Button variant="outline" className="w-full h-11 gap-2" onClick={handleDownload}>
                  <Icon name="Download" size={17} />
                  Скачать
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DecomposerModal;