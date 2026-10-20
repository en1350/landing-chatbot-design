import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import WorksheetPreview from "@/components/worksheet/WorksheetPreview";
import { exportWorksheetPdf } from "@/components/worksheet/exportWorksheetPdf";
import {
  LEVELS,
  REFINE_HINTS,
  TASK_TYPE_LABELS,
  WorksheetTask,
  WorksheetTaskType,
  createTask,
  fromApi,
} from "@/components/worksheet/worksheetConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";
const MAX_FILE_MB = 10;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

const readAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file);
  });

const WorksheetBuilder = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [topic, setTopic] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [group, setGroup] = useState("");
  const [teacher, setTeacher] = useState("");
  const [planText, setPlanText] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [level, setLevel] = useState(LEVELS[1]);
  const [taskCount, setTaskCount] = useState("5");
  const [tasks, setTasks] = useState<WorksheetTask[]>([createTask()]);

  const [loading, setLoading] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const sheetWrapRef = useRef<HTMLDivElement>(null);

  const updateTask = (id: number, patch: Partial<WorksheetTask>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTask = (id: number) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const moveTask = (id: number, dir: -1 | 1) =>
    setTasks((prev) => {
      const i = prev.findIndex((t) => t.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Файл слишком большой — максимум ${MAX_FILE_MB} МБ`);
      return;
    }
    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (!["txt", "pdf", "docx"].includes(ext)) {
      toast.error("Поддерживаются файлы TXT, DOCX и PDF");
      return;
    }
    setReading(true);
    try {
      let text = "";
      if (ext === "txt") {
        text = await readAsText(file);
      } else {
        const base64 = await readAsDataUrl(file);
        const res = await fetch(GENERATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extract_text", file_base64: base64, filename: file.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не удалось прочитать файл");
        text = data.text;
      }
      if (!text.trim()) throw new Error("В файле не найден текст");
      setPlanText(text);
      setFileName(file.name);
      if (!topic.trim()) {
        const firstLine = text.split("\n").find((l) => l.trim());
        if (firstLine) setTopic(firstLine.trim().slice(0, 80));
      }
      toast.success("План-конспект загружен — ИИ опирается на него при составлении заданий");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось прочитать файл");
    } finally {
      setReading(false);
    }
  };

  const clearFile = () => {
    setPlanText("");
    setFileName("");
  };

  const guard = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    return true;
  };

  const callAi = async (action: "worksheet" | "worksheet_refine", instruction?: string) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
      body: JSON.stringify({
        action,
        ...(instruction ? { instruction } : {}),
        fields: {
          topic,
          discipline,
          group,
          level,
          planText,
          taskCount,
          ...(action === "worksheet_refine"
            ? {
                tasks: tasks.map((t) => ({
                  type: t.type,
                  title: t.title,
                  description: t.description,
                })),
              }
            : {}),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось составить задания");
    return fromApi(data.tasks);
  };

  const generate = async () => {
    if (!guard()) return;
    if (!topic.trim() && !planText.trim()) {
      toast.error("Укажите тему урока или загрузите план-конспект");
      return;
    }
    setLoading(true);
    try {
      setTasks(await callAi("worksheet"));
      toast.success("Задания готовы — проверьте и при необходимости отредактируйте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить задания");
    } finally {
      setLoading(false);
    }
  };

  const refine = async () => {
    if (!guard()) return;
    if (!refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      setTasks(await callAi("worksheet_refine", refineInstruction.trim()));
      setRefineInstruction("");
      setRefineOpen(false);
      toast.success("Задания доработаны — проверьте изменения");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать задания");
    } finally {
      setRefining(false);
    }
  };

  const downloadPdf = async () => {
    const el = sheetWrapRef.current?.querySelector<HTMLElement>("#worksheet-sheet");
    if (!el) return;
    setExporting(true);
    try {
      await exportWorksheetPdf(el, `Рабочий лист — ${topic.trim() || "без темы"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить PDF");
    } finally {
      setExporting(false);
    }
  };

  const meta = { topic, group, teacher, planText };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
        onOpenPricing={() => setProfileOpen(true)}
      />

      <main className="flex-1">
        <div className="container py-6 sm:py-10 md:py-14">
          <Link
            to="/"
            className="no-print mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="no-print mb-8 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="mt-2 mb-3 font-display text-2xl font-bold sm:text-3xl md:text-4xl">Конструктор рабочих листов</h1>
            <p className="text-muted-foreground">
              Загрузите план-конспект или укажите тему — ИИ составит задания для рабочего листа. Лист можно править
              вручную и скачать в PDF.
            </p>
          </div>

          <div className="worksheet-grid grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
            <div className="no-print space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">План-конспект урока (необязательно)</label>
                <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" className="hidden" onChange={handleFile} />
                {fileName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <Icon name="FileText" size={16} className="shrink-0 text-primary" />
                    <span className="flex-1 truncate">{fileName}</span>
                    <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={reading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent disabled:opacity-60"
                  >
                    <Icon name={reading ? "Loader" : "Upload"} size={16} className={reading ? "animate-spin" : ""} />
                    {reading ? "Читаю файл..." : "Загрузить DOCX, PDF или TXT"}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Тема урока</label>
                  <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Алгоритмизация и программирование" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Дисциплина</label>
                  <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Например: Информатика" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Группа / класс</label>
                    <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="1 курс, ИС-21" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Преподаватель</label>
                    <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="ФИО" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Сложность</label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Число заданий</label>
                    <Select value={taskCount} onValueChange={setTaskCount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["3", "4", "5", "6", "8", "10"].map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={generate} disabled={loading} className="w-full gap-2">
                <Icon name={loading ? "Loader" : "Sparkles"} size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "ИИ составляет задания..." : "Составить задания с ИИ"}
              </Button>

              <div className="space-y-3 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Задания листа ({tasks.length})</span>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setTasks((p) => [...p, createTask()])}>
                    <Icon name="Plus" size={14} />
                    Добавить
                  </Button>
                </div>

                {tasks.map((task, index) => (
                  <div key={task.id} className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-primary">№ {index + 1}</span>
                      <div className="ml-auto flex items-center gap-0.5">
                        <button type="button" onClick={() => moveTask(task.id, -1)} disabled={index === 0} className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
                          <Icon name="ChevronUp" size={15} />
                        </button>
                        <button type="button" onClick={() => moveTask(task.id, 1)} disabled={index === tasks.length - 1} className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30">
                          <Icon name="ChevronDown" size={15} />
                        </button>
                        <button type="button" onClick={() => removeTask(task.id)} className="rounded p-1 text-destructive hover:bg-accent">
                          <Icon name="Trash2" size={15} />
                        </button>
                      </div>
                    </div>
                    <Input value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} placeholder="Название задания" />
                    <Select value={task.type} onValueChange={(v) => updateTask(task.id, { type: v as WorksheetTaskType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TASK_TYPE_LABELS) as WorksheetTaskType[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {TASK_TYPE_LABELS[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea rows={3} value={task.description} onChange={(e) => updateTask(task.id, { description: e.target.value })} placeholder="Условие задания" />
                    {task.type === "choice" && (
                      <Textarea
                        rows={3}
                        value={task.options.join("\n")}
                        onChange={(e) => updateTask(task.id, { options: e.target.value.split("\n") })}
                        placeholder="Варианты ответа — каждый с новой строки"
                      />
                    )}
                    {task.type === "table" && (
                      <div className="grid grid-cols-[1fr_90px] gap-2">
                        <Input
                          value={task.columns.join(", ")}
                          onChange={(e) => updateTask(task.id, { columns: e.target.value.split(",").map((c) => c.trimStart()) })}
                          placeholder="Столбцы через запятую"
                        />
                        <Input
                          type="number"
                          min={2}
                          max={8}
                          value={task.rows}
                          onChange={(e) => updateTask(task.id, { rows: Math.max(2, Math.min(8, Number(e.target.value) || 3)) })}
                          title="Число строк"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="no-print flex flex-wrap items-center gap-2">
                <Button onClick={downloadPdf} disabled={exporting} className="gap-2">
                  <Icon name={exporting ? "Loader" : "Download"} size={16} className={exporting ? "animate-spin" : ""} />
                  Скачать PDF
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Icon name="Printer" size={16} />
                  Печать
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setRefineOpen((v) => !v)}>
                  <Icon name="Wand2" size={16} />
                  Доработать с ИИ
                </Button>
              </div>

              {refineOpen && (
                <div className="no-print space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <Textarea
                    rows={2}
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Что изменить? Например: добавь задания на практическое применение"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {REFINE_HINTS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setRefineInstruction(h)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  {refineError && <p className="text-xs text-destructive">{refineError}</p>}
                  <Button onClick={refine} disabled={refining || !refineInstruction.trim()} className="gap-2">
                    <Icon name={refining ? "Loader" : "Sparkles"} size={15} className={refining ? "animate-spin" : ""} />
                    {refining ? "Дорабатываю..." : "Применить"}
                  </Button>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl bg-muted p-3 sm:p-5">
                <div ref={sheetWrapRef} className="w-fit mx-auto">
                  <WorksheetPreview meta={meta} tasks={tasks} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
      />
      <DecomposerModal
        open={decomposerOpen}
        onClose={() => setDecomposerOpen(false)}
        onNeedAuth={() => {
          setDecomposerOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setDecomposerOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={() => {
          setAntiplagiatOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setAntiplagiatOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNeedAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onNeedAuth={() => {
          setUpgradeOpen(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
};

export default WorksheetBuilder;
