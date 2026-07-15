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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useUsage, GeneratorType } from "@/context/UsageContext";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { downloadTxt } from "@/lib/download";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

interface GeneratorModalProps {
  open: boolean;
  onClose: () => void;
  type: GeneratorType | null;
  onNeedUpgrade: () => void;
  onNeedAuth: () => void;
}

const META: Record<GeneratorType, { title: string; icon: string; resultLabel: string }> = {
  lesson: { title: "Генератор уроков", icon: "📘", resultLabel: "план урока" },
  game: { title: "Генератор игры", icon: "🎲", resultLabel: "сценарий игры" },
  intensive: { title: "Генератор интенсивов и мастер-классов", icon: "🚀", resultLabel: "программа интенсива" },
  task: { title: "Генератор заданий", icon: "📝", resultLabel: "комплект заданий" },
};

interface LessonFields {
  subject: string;
  topic: string;
  goal: string;
  tasks: string;
  technology: string;
  ageCount: string;
  duration: "45" | "90";
}

interface GameFields {
  subject: string;
  duration: "5" | "15" | "45";
  peopleCount: string;
}

interface SimpleFields {
  topic: string;
  grade: string;
}

async function requestGeneration(type: GeneratorType, fields: Record<string, string>): Promise<string> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generate", type, fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось сгенерировать материал");
  return data.content as string;
}

async function requestRefine(content: string, instruction: string): Promise<string> {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refine", content, instruction }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Не удалось доработать материал");
  return data.content as string;
}

const GeneratorModal = ({ open, onClose, type, onNeedUpgrade, onNeedAuth }: GeneratorModalProps) => {
  const { canUse, registerUse, remaining, isPaid } = useUsage();
  const { token, user } = useAuth();

  const [lessonFields, setLessonFields] = useState<LessonFields>({
    subject: "",
    topic: "",
    goal: "",
    tasks: "",
    technology: "",
    ageCount: "",
    duration: "45",
  });
  const [gameFields, setGameFields] = useState<GameFields>({
    subject: "",
    duration: "15",
    peopleCount: "",
  });
  const [simpleFields, setSimpleFields] = useState<SimpleFields>({ topic: "", grade: "" });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  if (!type) return null;
  const meta = META[type];

  const reset = () => {
    setLessonFields({ subject: "", topic: "", goal: "", tasks: "", technology: "", ageCount: "", duration: "45" });
    setGameFields({ subject: "", duration: "15", peopleCount: "" });
    setSimpleFields({ topic: "", grade: "" });
    setResult(null);
    setError(null);
    setLoading(false);
    setSaved(false);
    setRefineOpen(false);
    setRefineInstruction("");
    setRefineError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!canUse(type)) {
      onNeedUpgrade();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fields: Record<string, string> =
        type === "lesson" ? lessonFields : type === "game" ? gameFields : simpleFields;
      const content = await requestGeneration(type, fields);
      setResult(content);
      registerUse(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка генерации, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!result || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const updated = await requestRefine(result, refineInstruction.trim());
      setResult(updated);
      setRefineInstruction("");
      setRefineOpen(false);
      setSaved(false);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать материал");
    } finally {
      setRefining(false);
    }
  };

  const resultTopic =
    type === "lesson" ? lessonFields.topic : type === "game" ? gameFields.subject : simpleFields.topic;
  const resultTitle = `${meta.title}: ${resultTopic || "без темы"}`;

  const handleDownload = () => {
    if (!result) return;
    downloadTxt(resultTitle, [resultTitle, "", result]);
  };

  const handleSave = async () => {
    if (!result) return;
    if (!token || !user) {
      onNeedAuth();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "save_material",
          type,
          title: resultTitle,
          content: result,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">{meta.icon}</span>
            {meta.title}
          </DialogTitle>
          <DialogDescription>
            {isPaid
              ? "Безлимитная генерация по вашему тарифу"
              : `Осталось бесплатных генераций: ${remaining(type)} из 3`}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            {type === "lesson" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
                  <Input
                    value={lessonFields.subject}
                    onChange={(e) => setLessonFields((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="Например: Биология, Математика, История..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Тема</label>
                  <Input
                    value={lessonFields.topic}
                    onChange={(e) => setLessonFields((s) => ({ ...s, topic: e.target.value }))}
                    placeholder="Например: Фотосинтез, Дроби..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Цель</label>
                  <Input
                    value={lessonFields.goal}
                    onChange={(e) => setLessonFields((s) => ({ ...s, goal: e.target.value }))}
                    placeholder="Например: сформировать понимание процесса фотосинтеза"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Задачи</label>
                  <Textarea
                    value={lessonFields.tasks}
                    onChange={(e) => setLessonFields((s) => ({ ...s, tasks: e.target.value }))}
                    placeholder="Каждую задачу с новой строки или через запятую"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Технология обучения</label>
                  <Input
                    value={lessonFields.technology}
                    onChange={(e) => setLessonFields((s) => ({ ...s, technology: e.target.value }))}
                    placeholder="Например: проблемное обучение, смешанное обучение"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Возраст / количество человек</label>
                  <Input
                    value={lessonFields.ageCount}
                    onChange={(e) => setLessonFields((s) => ({ ...s, ageCount: e.target.value }))}
                    placeholder="Например: 7 класс, 25 человек"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Время урока</label>
                  <Select
                    value={lessonFields.duration}
                    onValueChange={(v: "45" | "90") => setLessonFields((s) => ({ ...s, duration: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45 минут</SelectItem>
                      <SelectItem value="90">90 минут</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "game" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
                  <Input
                    value={gameFields.subject}
                    onChange={(e) => setGameFields((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="Например: Английский язык, Химия..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Время</label>
                  <Select
                    value={gameFields.duration}
                    onValueChange={(v: "5" | "15" | "45") => setGameFields((s) => ({ ...s, duration: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 минут</SelectItem>
                      <SelectItem value="15">15 минут</SelectItem>
                      <SelectItem value="45">45 минут</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Количество человек</label>
                  <Input
                    value={gameFields.peopleCount}
                    onChange={(e) => setGameFields((s) => ({ ...s, peopleCount: e.target.value }))}
                    placeholder="Например: 20"
                  />
                </div>
              </>
            )}

            {(type === "intensive" || type === "task") && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {type === "intensive" ? "Тема интенсива" : "Тема задания"}
                  </label>
                  <Input
                    value={simpleFields.topic}
                    onChange={(e) => setSimpleFields((s) => ({ ...s, topic: e.target.value }))}
                    placeholder="Например: Критическое мышление"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Класс / возраст</label>
                  <Input
                    value={simpleFields.grade}
                    onChange={(e) => setSimpleFields((s) => ({ ...s, grade: e.target.value }))}
                    placeholder="Например: 7 класс"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} />
                {error}
              </p>
            )}

            <Button
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={17} className="animate-spin" />
                  ИИ генерирует материал...
                </>
              ) : (
                <>
                  <Icon name="Wand2" size={17} />
                  Сгенерировать с ИИ
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-4 animate-fade-in">
            <div className="rounded-xl border border-border bg-secondary/50 p-4 max-h-80 overflow-y-auto">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Готовый {meta.resultLabel}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{result}</p>
            </div>

            {!refineOpen ? (
              <Button
                variant="outline"
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setRefineOpen(true)}
              >
                <Icon name="Sparkles" size={16} />
                Доработать с ИИ
              </Button>
            ) : (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                <label className="text-sm font-medium block">Что доработать или исправить?</label>
                <Textarea
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  placeholder="Например: добавь ещё один пример, сократи практическую часть, исправь ошибку в задаче 2..."
                  rows={3}
                />
                {refineError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={14} />
                    {refineError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setRefineOpen(false);
                      setRefineInstruction("");
                      setRefineError(null);
                    }}
                    disabled={refining}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
                    onClick={handleRefine}
                    disabled={refining || !refineInstruction.trim()}
                  >
                    {refining ? (
                      <Icon name="Loader2" size={15} className="animate-spin" />
                    ) : (
                      <Icon name="Sparkles" size={15} />
                    )}
                    Применить
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                <Icon name="RotateCcw" size={16} />
                Заново
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saving ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : saved ? (
                  <Icon name="CheckCircle2" size={16} className="text-primary" />
                ) : (
                  <Icon name="Save" size={16} />
                )}
                {saved ? "Сохранено" : "В кабинет"}
              </Button>
              <Button className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleDownload}>
                <Icon name="Download" size={16} />
                Скачать .txt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorModal;
