import { usePersistedState } from "@/hooks/use-persisted-state";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import SaveMaterialButton from "@/components/SaveMaterialButton";
import KosImportDialog from "@/components/kos/KosImportDialog";
import { useAuth } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { GENERATE_URL } from "@/components/generator/generatorConfig";
import {
  EMPTY_KOS,
  INTERMEDIATE_OPTIONS,
  KOS_CONTROL_TYPES,
  KOS_TASK_TYPES,
  KosCompetency,
  KosData,
  KosLevel,
  KosTask,
  PASSPORT_FIELDS,
  allIndicatorKeys,
  buildKosText,
} from "@/components/kos/kosConfig";

const AI_PARTS: { key: string; label: string }[] = [
  { key: "competencies", label: "Компетенции (ОК и ПК) с элементами" },
  { key: "control", label: "Формы контроля" },
  { key: "tasks", label: "Оценочные средства (задания)" },
  { key: "criteria", label: "Шкала, критерии и уровни" },
];

const REFINE_HINTS = ["Сделай задания сложнее", "Добавь практический пример", "Уточни критерии оценки", "Сократи формулировки"];

const NONE = "none";

const KosBuilder = () => {
  const { user, token, canUsePaid: isPaid } = useAuth();
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [data, setData] = usePersistedState<KosData>("kos_data", EMPTY_KOS);
  const [tab, setTab] = useState("passport");
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiParts, setAiParts] = useState<string[]>(["competencies", "control", "tasks", "criteria"]);
  const [wish, setWish] = useState("");
  const [compCount, setCompCount] = useState("4");
  const [taskCount, setTaskCount] = useState("5");
  const [aiLoading, setAiLoading] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineParts, setRefineParts] = useState<string[]>(["tasks"]);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [criteriaIdx, setCriteriaIdx] = useState<number | null>(null);
  const [maxScore, setMaxScore] = usePersistedState("kos_maxScore", "10");
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<KosData>) => setData((d) => ({ ...d, ...p }));
  const setPassport = (k: string, v: string) => setData((d) => ({ ...d, passport: { ...d.passport, [k]: v } }));
  const setControl = (k: keyof KosData["control"], v: string) => setData((d) => ({ ...d, control: { ...d.control, [k]: v } }));

  const updateComp = (ci: number, p: Partial<KosCompetency>) =>
    patch({ competencies: data.competencies.map((c, i) => (i === ci ? { ...c, ...p } : c)) });
  const updateInd = (ci: number, ii: number, p: Partial<{ code: string; name: string }>) =>
    patch({
      competencies: data.competencies.map((c, i) =>
        i === ci ? { ...c, indicators: c.indicators.map((x, j) => (j === ii ? { ...x, ...p } : x)) } : c
      ),
    });
  const updateTask = (ti: number, p: Partial<KosTask>) => patch({ tasks: data.tasks.map((t, i) => (i === ti ? { ...t, ...p } : t)) });
  const updateLevel = (li: number, p: Partial<KosLevel>) => patch({ levels: data.levels.map((l, i) => (i === li ? { ...l, ...p } : l)) });

  const indicators = allIndicatorKeys(data.competencies);
  const discipline = data.passport.discipline || "";
  const docTitle = `ФОС — ${discipline.trim() || "КОС"}`;
  const text = buildKosText(data);

  const runAi = async () => {
    if (!user) return setAuthOpen(true);
    if (!isPaid) return setUpgradeOpen(true);
    if (!aiParts.length) return toast.error("Выберите, что заполнить");
    setAiLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({
          action: "kos_fill",
          parts: aiParts,
          fields: { ...data, wish, compCount: Number(compCount) || 4, taskCount: Number(taskCount) || 5 },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось получить ответ от ИИ");
      const r = json.result as Record<string, any>;
      setData((d) => {
        const next: KosData = { ...d };
        if (r.competencies) next.competencies = [...d.competencies, ...r.competencies.competencies];
        if (r.control) next.control = r.control;
        if (r.tasks) next.tasks = [...d.tasks, ...r.tasks.tasks];
        if (r.criteria) {
          next.scale = r.criteria.scale || d.scale;
          next.generalCriteria = r.criteria.generalCriteria || d.generalCriteria;
          if (r.criteria.levels?.length) next.levels = r.criteria.levels;
        }
        return next;
      });
      setAiOpen(false);
      if (json.failed?.length) toast.warning("Часть разделов заполнить не удалось, повторите для них запрос");
      else toast.success("ИИ заполнил КОС — проверьте и поправьте под себя");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка ИИ");
    } finally {
      setAiLoading(false);
    }
  };

  const partHasContent = (key: string) =>
    key === "competencies"
      ? data.competencies.length > 0
      : key === "control"
      ? Object.values(data.control).some((v) => v.trim())
      : key === "tasks"
      ? data.tasks.length > 0
      : !!(data.scale.trim() || data.generalCriteria.trim() || data.levels.length);

  const hasAnyContent = AI_PARTS.some((p) => partHasContent(p.key));

  const openRefine = () => {
    if (!user) return setAuthOpen(true);
    if (!isPaid) return setUpgradeOpen(true);
    setRefineParts((prev) => {
      const filled = prev.filter(partHasContent);
      return filled.length ? filled : AI_PARTS.filter((p) => partHasContent(p.key)).slice(0, 1).map((p) => p.key);
    });
    setRefineOpen(true);
  };

  const runRefine = async () => {
    if (!refineText.trim()) return toast.error("Напишите, что нужно доработать");
    if (!refineParts.length) return toast.error("Выберите разделы для доработки");
    setRefining(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({ action: "kos_refine", parts: refineParts, instruction: refineText.trim(), fields: data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось получить ответ от ИИ");
      const r = json.result as Record<string, any>;
      setData((d) => {
        const next: KosData = { ...d };
        if (r.competencies) next.competencies = r.competencies.competencies;
        if (r.control) next.control = r.control;
        if (r.tasks) {
          const old = d.tasks;
          next.tasks = r.tasks.tasks.map((t: KosTask, i: number) => {
            const prev = old.find((o) => o.name === t.name) || (old.length === r.tasks.tasks.length ? old[i] : undefined);
            return prev?.criteria ? { ...t, criteria: prev.criteria } : t;
          });
        }
        if (r.criteria) {
          next.scale = r.criteria.scale;
          next.generalCriteria = r.criteria.generalCriteria;
          next.levels = r.criteria.levels;
        }
        return next;
      });
      setRefineText("");
      setRefineOpen(false);
      if (json.failed?.length) toast.warning("Часть разделов доработать не удалось, они остались без изменений");
      else toast.success("Разделы доработаны — проверьте изменения");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка ИИ");
    } finally {
      setRefining(false);
    }
  };

  const genTaskCriteria = async (ti: number) => {
    if (!user) return setAuthOpen(true);
    if (!isPaid) return setUpgradeOpen(true);
    const t = data.tasks[ti];
    if (!t.name.trim() && !t.description.trim()) return toast.error("Заполните название или описание задания");
    setCriteriaIdx(ti);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({
          action: "kos_task_criteria",
          maxScore: Number(maxScore) || 10,
          task: { name: t.name, type: t.type, controlType: t.controlType, indicator: t.indicator, description: t.description },
          fields: { passport: data.passport, competencies: data.competencies, scale: data.scale },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось получить ответ от ИИ");
      updateTask(ti, { criteria: json.criteria });
      toast.success("Критерии составлены — проверьте и поправьте под себя");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка ИИ");
    } finally {
      setCriteriaIdx(null);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kos.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setData({ ...EMPTY_KOS, ...parsed, control: { ...EMPTY_KOS.control, ...(parsed.control || {}) } });
        toast.success("Данные загружены");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm("Очистить весь КОС? Действие необратимо.")) return;
    setData(EMPTY_KOS);
  };

  const label = (t: string) => <label className="block text-sm font-semibold mb-1.5">{t}</label>;

  const empty = (t: string) => <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">{t}</div>;

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

      <main className="flex-1 py-8 md:py-12">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print">
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-6 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога СПО</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">Конструктор КОС</h1>
            <p className="text-muted-foreground">
              Фонд оценочных средств по ФГОС СПО: паспорт, компетенции, формы контроля, задания, критерии и матрица. ИИ заполнит разделы, а задания можно добавить из генераторов тестов, заданий и заданий по ПМ.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-5 no-print">
            <Button className="gap-2" onClick={() => setAiOpen(true)}>
              <Icon name="Sparkles" size={16} />
              Заполнить с ИИ
            </Button>
            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5" onClick={openRefine} disabled={!hasAnyContent}>
              <Icon name="Sparkles" size={16} />
              Доработать с ИИ
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <Icon name="Plus" size={16} />
              Задания из генераторов
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setTab("preview")}>
              <Icon name="Eye" size={16} />
              Предпросмотр
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportJson}>
              <Icon name="Download" size={16} />
              Экспорт JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Icon name="Upload" size={16} />
              Импорт JSON
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJson} />
            <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={clearAll}>
              <Icon name="Trash2" size={16} />
              Очистить
            </Button>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="no-print flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="passport">Паспорт</TabsTrigger>
              <TabsTrigger value="competencies">Компетенции ({data.competencies.length})</TabsTrigger>
              <TabsTrigger value="control">Формы контроля</TabsTrigger>
              <TabsTrigger value="tasks">Оценочные средства ({data.tasks.length})</TabsTrigger>
              <TabsTrigger value="criteria">Критерии</TabsTrigger>
              <TabsTrigger value="matrix">Матрица</TabsTrigger>
              <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            </TabsList>

            <TabsContent value="passport" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print">
              <div className="grid gap-4 sm:grid-cols-2">
                {PASSPORT_FIELDS.map((f) => (
                  <div key={f.key}>
                    {label(f.label)}
                    <Input value={data.passport[f.key] || ""} onChange={(e) => setPassport(f.key, e.target.value)} placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  {label("Форма промежуточной аттестации")}
                  <Select value={data.passport.intermediate || NONE} onValueChange={(v) => setPassport("intermediate", v === NONE ? "" : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Не выбрана</SelectItem>
                      {INTERMEDIATE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {label("Год разработки")}
                  <Input value={data.passport.year || ""} onChange={(e) => setPassport("year", e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="competencies" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print space-y-4">
              <Button className="gap-2" onClick={() => patch({ competencies: [...data.competencies, { code: "", name: "", indicators: [{ code: "", name: "" }] }] })}>
                <Icon name="Plus" size={16} />
                Добавить компетенцию
              </Button>
              {data.competencies.length === 0 && empty("Компетенции не добавлены. Добавьте вручную или нажмите «Заполнить с ИИ».")}
              {data.competencies.map((c, ci) => (
                <div key={ci} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">Компетенция {ci + 1}</span>
                    <button className="text-destructive" title="Удалить" onClick={() => window.confirm("Удалить компетенцию?") && patch({ competencies: data.competencies.filter((_, i) => i !== ci) })}>
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <Input value={c.code} onChange={(e) => updateComp(ci, { code: e.target.value })} placeholder="ОК 01, ПК 1.1" />
                    <Input value={c.name} onChange={(e) => updateComp(ci, { name: e.target.value })} placeholder="Наименование компетенции" />
                  </div>
                  <div className="space-y-2 border-t border-dashed border-border pt-3">
                    {c.indicators.map((ind, ii) => (
                      <div key={ii} className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                        <Input value={ind.code} onChange={(e) => updateInd(ci, ii, { code: e.target.value })} placeholder="З.1, У.1" />
                        <Input value={ind.name} onChange={(e) => updateInd(ci, ii, { name: e.target.value })} placeholder="Знает, умеет, владеет..." />
                        <button className="text-destructive px-2" onClick={() => updateComp(ci, { indicators: c.indicators.filter((_, j) => j !== ii) })}>
                          <Icon name="X" size={16} />
                        </button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => updateComp(ci, { indicators: [...c.indicators, { code: "", name: "" }] })}>
                      <Icon name="Plus" size={14} />
                      Элемент
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="control" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print">
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["current", "Виды текущего контроля", "Опрос, тестирование, практические работы..."],
                  ["intermediate", "Виды промежуточного контроля", "Контрольная работа, коллоквиум..."],
                  ["final", "Итоговая аттестация / демонстрационный экзамен", "Дифференцированный зачёт, экзамен..."],
                  ["selfStudy", "Самостоятельная работа", "Подготовка к занятиям, домашние задания..."],
                ] as const).map(([k, l, ph]) => (
                  <div key={k}>
                    {label(l)}
                    <Textarea rows={4} value={data.control[k]} onChange={(e) => setControl(k, e.target.value)} placeholder={ph} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button className="gap-2" onClick={() => patch({ tasks: [...data.tasks, { name: "", type: KOS_TASK_TYPES[0], controlType: KOS_CONTROL_TYPES[0], indicator: "", description: "" }] })}>
                  <Icon name="Plus" size={16} />
                  Добавить задание
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
                  <Icon name="Wand2" size={16} />
                  Из генераторов
                </Button>
              </div>
              {data.tasks.length === 0 && empty("Заданий пока нет. Добавьте вручную, сгенерируйте с ИИ или возьмите из генераторов.")}
              {data.tasks.map((t, ti) => (
                <div key={ti} className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">Задание {ti + 1}</span>
                    <button className="text-destructive" title="Удалить" onClick={() => window.confirm("Удалить задание?") && patch({ tasks: data.tasks.filter((_, i) => i !== ti) })}>
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                  <Input value={t.name} onChange={(e) => updateTask(ti, { name: e.target.value })} placeholder="Название" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select value={t.type} onValueChange={(v) => updateTask(ti, { type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KOS_TASK_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={t.controlType} onValueChange={(v) => updateTask(ti, { controlType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KOS_CONTROL_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={t.indicator || NONE} onValueChange={(v) => updateTask(ti, { indicator: v === NONE ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Компетенция не выбрана</SelectItem>
                        {indicators.map((x) => <SelectItem key={x.key} value={x.key}>{x.key}: {x.ind.name.slice(0, 40)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea rows={5} value={t.description} onChange={(e) => updateTask(ti, { description: e.target.value })} placeholder="Формулировка задания, условия, требования" />
                  <div className="border-t border-dashed border-border pt-3 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => genTaskCriteria(ti)}
                        disabled={criteriaIdx !== null}
                      >
                        {criteriaIdx === ti ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Sparkles" size={14} />}
                        {criteriaIdx === ti ? "ИИ составляет критерии..." : t.criteria ? "Составить критерии заново" : "Сгенерировать критерии оценки"}
                      </Button>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Макс. балл
                        <Input type="number" min={1} max={100} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="h-8 w-20" />
                      </label>
                    </div>
                    {t.criteria !== undefined && t.criteria !== "" && (
                      <Textarea rows={8} value={t.criteria} onChange={(e) => updateTask(ti, { criteria: e.target.value })} placeholder="Критерии оценивания и уровни" />
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="criteria" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print space-y-4">
              <div>
                {label("Шкала оценивания")}
                <Textarea rows={4} value={data.scale} onChange={(e) => patch({ scale: e.target.value })} placeholder="86-100% — отлично; 70-85% — хорошо..." />
              </div>
              <div>
                {label("Общие критерии оценивания")}
                <Textarea rows={4} value={data.generalCriteria} onChange={(e) => patch({ generalCriteria: e.target.value })} />
              </div>
              <div className="border-t border-dashed border-border pt-4 space-y-3">
                <div className="font-semibold">Уровни сформированности компетенций</div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => patch({ levels: [...data.levels, { name: "", description: "", criteria: "" }] })}>
                  <Icon name="Plus" size={14} />
                  Добавить уровень
                </Button>
                {data.levels.map((l, li) => (
                  <div key={li} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input value={l.name} onChange={(e) => updateLevel(li, { name: e.target.value })} placeholder="Высокий / Средний / Низкий" />
                      <Input value={l.description} onChange={(e) => updateLevel(li, { description: e.target.value })} placeholder="86-100%" />
                      <button className="text-destructive px-2" onClick={() => patch({ levels: data.levels.filter((_, i) => i !== li) })}>
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                    <Textarea rows={3} value={l.criteria} onChange={(e) => updateLevel(li, { criteria: e.target.value })} placeholder="Признаки уровня" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="matrix" className="rounded-2xl border border-border bg-card p-4 sm:p-6 no-print">
              {data.tasks.length === 0 || indicators.length === 0 ? (
                empty("Добавьте компетенции с элементами и задания, чтобы построить матрицу.")
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="border border-border p-2 text-left">Оценочное средство</th>
                        <th className="border border-border p-2 text-left">Контроль</th>
                        {indicators.map((x) => <th key={x.key} title={x.ind.name} className="border border-border p-2">{x.key}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.tasks.map((t, i) => (
                        <tr key={i}>
                          <td className="border border-border p-2">{i + 1}. {t.name}<div className="text-xs text-muted-foreground">{t.type}</div></td>
                          <td className="border border-border p-2">{t.controlType}</td>
                          {indicators.map((x) => (
                            <td key={x.key} className="border border-border p-2 text-center">{t.indicator === x.key ? "✅" : "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-4 no-print">
                <Button variant="outline" className="gap-1.5" onClick={() => window.print()}><Icon name="Printer" size={15} />Печать / PDF</Button>
                <Button variant="outline" className="gap-1.5" onClick={() => downloadDocx(docTitle, "Фонд оценочных средств", text)}><Icon name="FileText" size={15} />Скачать Word</Button>
                <Button variant="outline" className="gap-1.5" onClick={() => downloadTxt(docTitle, [text])}><Icon name="Download" size={15} />Скачать TXT</Button>
                <SaveMaterialButton type="kos" title={docTitle} content={text} onNeedAuth={() => setAuthOpen(true)} />
              </div>
              <div id="kos-print" className="rounded-xl border border-border bg-white p-6 md:p-8 text-[#1e1b4b] whitespace-pre-wrap text-sm leading-relaxed">
                <h2 className="text-center font-display text-xl font-bold mb-1">ФОНД ОЦЕНОЧНЫХ СРЕДСТВ</h2>
                <p className="text-center text-muted-foreground mb-5">{discipline || "Дисциплина / МДК не указана"}</p>
                {text}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={aiOpen} onOpenChange={(v) => !aiLoading && setAiOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Заполнить КОС с ИИ</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ИИ опирается на данные паспорта (специальность, дисциплина). Новые компетенции и задания добавятся к уже имеющимся, остальные разделы будут перезаписаны.
          </p>
          <div className="space-y-2">
            {AI_PARTS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiParts.includes(p.key)}
                  onChange={() => setAiParts((prev) => (prev.includes(p.key) ? prev.filter((x) => x !== p.key) : [...prev, p.key]))}
                />
                {p.label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>{label("Сколько компетенций")}<Input type="number" min={1} max={12} value={compCount} onChange={(e) => setCompCount(e.target.value)} /></div>
            <div>{label("Сколько заданий")}<Input type="number" min={1} max={15} value={taskCount} onChange={(e) => setTaskCount(e.target.value)} /></div>
          </div>
          <div>
            {label("Пожелания (необязательно)")}
            <Textarea rows={3} value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Например: больше практических заданий, учесть демонстрационный экзамен" />
          </div>
          <Button className="w-full gap-2" onClick={runAi} disabled={aiLoading}>
            {aiLoading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Sparkles" size={16} />}
            {aiLoading ? "ИИ составляет КОС..." : "Заполнить"}
          </Button>
          {!isPaid && <p className="text-center text-xs text-muted-foreground">ИИ-заполнение доступно по подписке.</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={refineOpen} onOpenChange={(v) => !refining && setRefineOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Доработать КОС с ИИ</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Выберите разделы и напишите замечание. ИИ перепишет выбранные разделы целиком, остальные не тронет.
          </p>
          <div className="space-y-2">
            {AI_PARTS.map((p) => {
              const filled = partHasContent(p.key);
              return (
                <label key={p.key} className={`flex items-center gap-2 text-sm ${filled ? "cursor-pointer" : "opacity-50"}`}>
                  <input
                    type="checkbox"
                    disabled={!filled || refining}
                    checked={refineParts.includes(p.key)}
                    onChange={() => setRefineParts((prev) => (prev.includes(p.key) ? prev.filter((x) => x !== p.key) : [...prev, p.key]))}
                  />
                  {p.label}
                  {!filled && <span className="text-xs text-muted-foreground">(пусто)</span>}
                </label>
              );
            })}
          </div>
          <div>
            {label("Что доработать или исправить?")}
            <Textarea
              rows={3}
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              disabled={refining}
              placeholder="Например: сделай задания сложнее, добавь задание на демонстрационный экзамен, уточни критерии..."
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REFINE_HINTS.map((h) => (
              <button
                key={h}
                type="button"
                disabled={refining}
                onClick={() => setRefineText(h)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent transition-colors disabled:opacity-50"
              >
                {h}
              </button>
            ))}
          </div>
          <Button className="w-full gap-2" onClick={runRefine} disabled={refining || !refineText.trim() || !refineParts.length}>
            {refining ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Sparkles" size={16} />}
            {refining ? "ИИ дорабатывает..." : "Применить"}
          </Button>
        </DialogContent>
      </Dialog>

      <KosImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        discipline={discipline}
        competencies={data.competencies}
        onAdd={(tasks) => patch({ tasks: [...data.tasks, ...tasks] })}
        onNeedAuth={() => {
          setImportOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setImportOpen(false);
          setUpgradeOpen(true);
        }}
      />

      <Footer onOpenProfile={() => setProfileOpen(true)} onOpenRandomizer={() => setRandomizerOpen(true)} onOpenAntiplagiat={() => setAntiplagiatOpen(true)} />
      <DecomposerModal open={decomposerOpen} onClose={() => setDecomposerOpen(false)} onNeedAuth={() => { setDecomposerOpen(false); setAuthOpen(true); }} onNeedUpgrade={() => { setDecomposerOpen(false); setUpgradeOpen(true); }} />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal open={antiplagiatOpen} onClose={() => setAntiplagiatOpen(false)} onNeedAuth={() => { setAntiplagiatOpen(false); setAuthOpen(true); }} onNeedUpgrade={() => { setAntiplagiatOpen(false); setUpgradeOpen(true); }} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={() => { setProfileOpen(false); setAuthOpen(true); }} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={() => { setUpgradeOpen(false); setAuthOpen(true); }} />
    </div>
  );
};

export default KosBuilder;
