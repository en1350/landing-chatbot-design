import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

interface AntiplagiatModalProps {
  open: boolean;
  onClose: () => void;
  onNeedAuth: () => void;
  onNeedUpgrade: () => void;
}

interface SuspiciousFragment {
  quote: string;
  reason: string;
}

interface AntiplagiatResult {
  originality_percent: number;
  risk_level: string;
  summary: string;
  originality_notes: string;
  style_notes: string;
  sources_notes: string;
  suspicious_fragments: SuspiciousFragment[];
  review_parts: string[];
  recommendations: string[];
}

const RISK_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "низкий": { bg: "bg-primary/10", text: "text-primary", icon: "ShieldCheck" },
  "средний": { bg: "bg-amber-500/10", text: "text-amber-600", icon: "ShieldAlert" },
  "высокий": { bg: "bg-destructive/10", text: "text-destructive", icon: "ShieldX" },
};

function percentColor(percent: number): string {
  if (percent >= 70) return "#16a34a";
  if (percent >= 40) return "#d97706";
  return "#dc2626";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function requestExtractText(fileBase64: string, filename: string): Promise<string> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "extract_text", file_base64: fileBase64, filename }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось прочитать файл");
  return data.text as string;
}

async function requestAntiplagiatCheck(text: string): Promise<AntiplagiatResult> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "antiplagiat_check", text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось проверить работу");
  return data as AntiplagiatResult;
}

const ACCEPTED_EXT = [".pdf", ".docx"];

const AntiplagiatModal = ({ open, onClose, onNeedAuth, onNeedUpgrade }: AntiplagiatModalProps) => {
  const { user, isPaid, canUseGenerator, registerGeneratorUse, remainingUse } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<AntiplagiatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setText("");
    setFileName(null);
    setExtracting(false);
    setResult(null);
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!user) {
      onNeedAuth();
      return;
    }
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      setError("Поддерживаются только файлы PDF и DOCX");
      return;
    }
    setError(null);
    setResult(null);
    setExtracting(true);
    setFileName(file.name);
    try {
      const base64 = await fileToBase64(file);
      const extracted = await requestExtractText(base64, file.name);
      setText(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось прочитать файл, попробуйте снова");
      setFileName(null);
    } finally {
      setExtracting(false);
    }
  };

  const check = async () => {
    if (!text.trim()) return;
    if (!user) {
      onNeedAuth();
      return;
    }
    if (!isPaid && !canUseGenerator("antiplagiat")) {
      onNeedUpgrade();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!isPaid) {
        const registered = await registerGeneratorUse("antiplagiat");
        if (!registered) {
          onNeedUpgrade();
          setLoading(false);
          return;
        }
      }
      const r = await requestAntiplagiatCheck(text.trim());
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось проверить работу, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  const riskStyle = result ? RISK_STYLES[result.risk_level] || RISK_STYLES["средний"] : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">🔍</span> Антиплагиат
          </DialogTitle>
          <DialogDescription>
            {!user
              ? "Войдите в личный кабинет, чтобы получить 3 бесплатные проверки"
              : isPaid
              ? "Безлимитная проверка по вашему тарифу"
              : `Осталось бесплатных проверок: ${remainingUse("antiplagiat")} из 3`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => (user ? inputRef.current?.click() : onNeedAuth())}
            className={`relative rounded-2xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex items-center justify-center gap-2.5 py-2">
              {extracting ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Читаем файл «{fileName}»...</span>
                </>
              ) : fileName ? (
                <>
                  <Icon name="FileCheck2" size={18} className="text-primary" />
                  <span className="text-sm font-medium">{fileName}</span>
                </>
              ) : (
                <>
                  <Icon name="Upload" size={18} className="text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Загрузите PDF или DOCX, или вставьте текст ниже
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Текст работы</label>
            <Textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFileName(null);
              }}
              placeholder="Вставьте текст работы студента для проверки..."
              rows={8}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          <Button
            className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
            onClick={check}
            disabled={loading || extracting || !text.trim()}
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={17} className="animate-spin" />
                ИИ проверяет работу...
              </>
            ) : (
              <>
                <Icon name="Search" size={17} />
                Проверить на оригинальность
              </>
            )}
          </Button>

          {result && riskStyle && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-xl border border-border p-4 flex items-center gap-4">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${percentColor(result.originality_percent)} ${result.originality_percent * 3.6}deg, hsl(var(--secondary)) 0deg)`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
                    <span className="text-sm font-display font-bold">{result.originality_percent}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Уникальность текста</p>
                  <p className="text-sm font-semibold">
                    {result.originality_percent >= 70
                      ? "Высокая оригинальность"
                      : result.originality_percent >= 40
                      ? "Средняя оригинальность"
                      : "Низкая оригинальность"}
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-3.5 flex items-center gap-3 ${riskStyle.bg}`}>
                <Icon name={riskStyle.icon} size={22} className={riskStyle.text} />
                <div>
                  <p className="text-xs text-muted-foreground">Риск проблем с оригинальностью</p>
                  <p className={`text-sm font-bold capitalize ${riskStyle.text}`}>{result.risk_level}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5">
                <p className="text-sm font-semibold mb-1">Заключение</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>

              <div className="rounded-xl border border-border p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Оригинальность</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.originality_notes}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Стиль</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.style_notes}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Работа с источниками</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.sources_notes}</p>
                </div>
              </div>

              {result.suspicious_fragments?.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Icon name="AlertTriangle" size={15} className="text-destructive" />
                    Подозрительные фрагменты
                  </p>
                  <div className="space-y-2.5">
                    {result.suspicious_fragments.map((f, i) => (
                      <div key={i} className="text-sm">
                        <p className="italic text-foreground/90">«{f.quote}»</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.review_parts?.length > 0 && (
                <div className="rounded-xl border border-border p-3.5">
                  <p className="text-sm font-semibold mb-2">Требует проверки преподавателем</p>
                  <ul className="space-y-1.5">
                    {result.review_parts.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <Icon name="Eye" size={14} className="text-primary shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="rounded-xl border border-border p-3.5">
                  <p className="text-sm font-semibold mb-2">Рекомендации</p>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <Icon name="CheckCircle2" size={14} className="text-primary shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AntiplagiatModal;