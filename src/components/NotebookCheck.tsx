import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface NotebookCheckProps {
  id?: string;
}

interface CheckResult {
  score: number;
  correct: number;
  total: number;
  notes: string[];
}

function buildMockCheck(): CheckResult {
  const total = 8;
  const correct = 5 + Math.floor(Math.random() * 3);
  return {
    score: Math.round((correct / total) * 100),
    correct,
    total,
    notes: [
      "Задание 2: ошибка в вычислении — проверьте порядок действий",
      "Задание 5: недостаточно развёрнутое пояснение ответа",
      "Почерк аккуратный, оформление соответствует требованиям",
    ],
  };
}

const NotebookCheck = ({ id }: NotebookCheckProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setLoading(true);
    setTimeout(() => {
      setResult(buildMockCheck());
      setLoading(false);
    }, 1400);
  };

  return (
    <section id={id} className="container py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in">
          <span className="text-xs font-bold uppercase tracking-widest text-coral">Автопроверка</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">
            Проверка тетради по фото
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-md">
            Сфотографируйте работу ученика — ИИ найдёт ошибки, оценит уровень выполнения
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
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
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
                    Анализирую работу...
                  </div>
                )}
                {result && (
                  <div className="text-left rounded-xl bg-secondary/60 p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">Результат проверки</span>
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
                  }}
                  className="gap-1.5"
                >
                  <Icon name="RotateCcw" size={14} />
                  Загрузить другое фото
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotebookCheck;
