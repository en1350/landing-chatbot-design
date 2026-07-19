import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

interface NotebookCheckProps {
  id?: string;
  onNeedAuth: () => void;
  onNeedUpgrade: () => void;
}

interface CheckResult {
  score: number;
  correct: number;
  total: number;
  notes: string[];
}

const SUBJECTS = [
  "Математика",
  "Русский язык",
  "Литература",
  "Информатика",
  "Физика",
  "Химия",
  "История",
  "Обществознание",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function requestNotebookCheck(imageBase64: string, subject: string, token: string | null): Promise<CheckResult> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Authorization": token } : {}),
    },
    body: JSON.stringify({ action: "notebook_check", image_base64: imageBase64, subject }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось проверить работу");
  return data as CheckResult;
}

const NotebookCheck = ({ id, onNeedAuth, onNeedUpgrade }: NotebookCheckProps) => {
  const { user, isPaid, token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const checkResult = await requestNotebookCheck(base64, subject, token);
      setResult(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось проверить работу, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id={id} className="container py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="animate-fade-in">
          <span className="text-xs font-bold uppercase tracking-widest text-coral">Автопроверка</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">
            Проверка тетради по фото
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-md">
            Выберите предмет, сфотографируйте работу ученика — ИИ найдёт ошибки, оценит уровень выполнения
            и предложит комментарии для обратной связи. Экономит часы проверки тетрадей каждую неделю.
          </p>
          <ul className="mt-6 space-y-3">
            {["Распознавание рукописного текста", "Поиск ошибок и подсказки по критериям", "Готовая оценка и комментарий"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm">
                <Icon name="CheckCircle2" size={17} className="text-primary shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {!isPaid ? (
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
                🔒
              </div>
              <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-xs mx-auto">
                Проверка тетради по фото — премиум-инструмент. Оформите подписку, чтобы ИИ проверял работы
                учеников без ограничений.
              </p>
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 h-11 px-6"
                onClick={user ? onNeedUpgrade : onNeedAuth}
              >
                <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
                {user ? "Оформить подписку" : "Войти и оформить подписку"}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">Предмет</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                className={`relative rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {!preview ? (
                  <div className="py-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                      <Icon name="Camera" size={26} />
                    </div>
                    <p className="font-medium mb-1">Загрузите фото работы</p>
                    <p className="text-sm text-muted-foreground mb-4">Перетащите файл сюда или нажмите для выбора</p>
                    <Button type="button" variant="outline" className="gap-2">
                      <Icon name="Upload" size={16} />
                      Выбрать фото
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img src={preview} alt="Загруженная работа" className="mx-auto max-h-56 rounded-xl object-contain shadow-sm" />
                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        ИИ анализирует работу по предмету «{subject}»...
                      </div>
                    )}
                    {error && (
                      <p className="text-sm text-destructive flex items-center justify-center gap-1.5">
                        <Icon name="AlertCircle" size={14} />
                        {error}
                      </p>
                    )}
                    {result && (
                      <div className="text-left rounded-xl bg-secondary/60 p-4 animate-fade-in">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold">Результат проверки · {subject}</span>
                          <span className="font-display text-2xl font-bold text-primary">{result.score}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Правильно выполнено {result.correct} из {result.total} заданий
                        </p>
                        <ul className="space-y-1.5">
                          {result.notes.map((n, i) => (
                            <li key={i} className="text-xs flex gap-1.5">
                              <Icon name="MessageSquare" size={13} className="text-coral shrink-0 mt-0.5" />
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        setResult(null);
                        setError(null);
                      }}
                      className="gap-1.5"
                    >
                      <Icon name="RotateCcw" size={14} />
                      Загрузить другое фото
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotebookCheck;