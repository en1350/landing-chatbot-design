import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { GENERATE_URL, QUIZ_DIFFICULTY_OPTIONS, QUIZ_TYPE_OPTIONS } from "@/components/generator/generatorConfig";
import { LEVEL_LABEL, PM_LEVELS, PM_TASK_TYPES } from "@/components/pm-task/pmTaskConfig";
import { KosCompetency, KosTask, allIndicatorKeys } from "@/components/kos/kosConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  discipline: string;
  competencies: KosCompetency[];
  onAdd: (tasks: KosTask[]) => void;
  onNeedAuth: () => void;
  onNeedUpgrade: () => void;
}

type Source = "quiz" | "task" | "pm";

const NO_IND = "none";

const KosImportDialog = ({ open, onClose, discipline, competencies, onAdd, onNeedAuth, onNeedUpgrade }: Props) => {
  const { user, token, canUseGenerator, registerGeneratorUse, canUsePaid } = useAuth();
  const [source, setSource] = useState<Source>("quiz");
  const [loading, setLoading] = useState(false);
  const [indicator, setIndicator] = useState(NO_IND);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("mixed");
  const [qTypes, setQTypes] = useState<string[]>(["single"]);
  const [taskGoal, setTaskGoal] = useState("");
  const [pmCode, setPmCode] = useState("");
  const [pmName, setPmName] = useState("");
  const [pmType, setPmType] = useState("practical");
  const [pmLevel, setPmLevel] = useState("mixed");
  const [pmCount, setPmCount] = useState("3");

  const [quizText, setQuizText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [pmTasks, setPmTasks] = useState<KosTask[]>([]);

  const indicators = allIndicatorKeys(competencies);
  const indValue = indicator === NO_IND ? "" : indicator;

  const call = async (body: object) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось получить ответ от ИИ");
    return data;
  };

  const generate = async () => {
    if (!user) return onNeedAuth();
    if (!topic.trim()) return toast.error("Укажите тему");
    setLoading(true);
    try {
      if (source === "pm") {
        if (!canUsePaid) return onNeedUpgrade();
        const data = await call({
          action: "pm_task",
          fields: {
            pmCode, pmName, mdkTopic: topic, taskType: pmType, level: pmLevel,
            taskCount: Number(pmCount) || 3, duration: 90, controlForm: "Дифференцированный зачёт",
          },
        });
        const typeLabel = PM_TASK_TYPES.find((t) => t.value === pmType)?.label || "Практическое задание";
        setPmTasks(
          (data.tasks as { text: string; level: string }[]).map((t, i) => ({
            name: `${typeLabel} по ПМ №${i + 1}: ${topic.trim()}`,
            type: pmType === "test" ? "Тест" : pmType === "lab" ? "Лабораторная работа" : pmType === "situational" ? "Кейс-задача" : pmType === "project" ? "Курсовой проект" : "Практическое задание",
            controlType: "Текущий",
            indicator: "",
            description: `${t.text}\nУровень: ${LEVEL_LABEL[t.level] || t.level}`,
            source: "pm",
          }))
        );
        return;
      }
      if (!canUseGenerator(source)) return onNeedUpgrade();
      if (!(await registerGeneratorUse(source))) return onNeedUpgrade();
      const fields =
        source === "quiz"
          ? { subject: discipline, topic, questionCount: count, difficulty, questionTypes: qTypes.join(",") }
          : { subject: discipline, topic, goal: taskGoal, component: "balanced", competencies: "" };
      const data = await call({ action: "generate", type: source, fields });
      if (source === "quiz") setQuizText(data.content);
      else setTaskText(data.content);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const finish = (tasks: KosTask[]) => {
    onAdd(tasks.map((t) => ({ ...t, indicator: indValue })));
    toast.success(`Добавлено заданий: ${tasks.length}`);
    setQuizText("");
    setTaskText("");
    setPmTasks([]);
    onClose();
  };

  const addQuiz = () =>
    finish([{ name: `Тест: ${topic.trim()}`, type: "Тест", controlType: "Текущий", indicator: "", description: quizText.trim(), source: "quiz" }]);
  const addTask = () =>
    finish([{ name: `Комплект заданий: ${topic.trim()}`, type: "Практическое задание", controlType: "Текущий", indicator: "", description: taskText.trim(), source: "task" }]);

  const toggleType = (v: string) => setQTypes((p) => (p.includes(v) ? (p.length > 1 ? p.filter((x) => x !== v) : p) : [...p, v]));

  const genButton = (label: string) => (
    <Button className="w-full gap-2" onClick={generate} disabled={loading}>
      {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Sparkles" size={16} />}
      {loading ? "ИИ работает..." : label}
    </Button>
  );

  const indicatorPicker = (
    <div>
      <label className="block text-sm font-semibold mb-1.5">Привязать к компетенции</label>
      <Select value={indicator} onValueChange={setIndicator}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_IND}>Не привязывать</SelectItem>
          {indicators.map((x) => (
            <SelectItem key={x.key} value={x.key}>{x.key}: {x.ind.name.slice(0, 50)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const topicField = (label = "Тема") => (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label}</label>
      <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Основы алгоритмизации" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить задания из генераторов</DialogTitle>
        </DialogHeader>
        <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quiz">Тесты</TabsTrigger>
            <TabsTrigger value="task">Задания</TabsTrigger>
            <TabsTrigger value="pm">По ПМ</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="space-y-3.5 mt-4">
            {topicField()}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Количество вопросов</label>
                <Input type="number" min={1} max={40} value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Сложность</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUIZ_DIFFICULTY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUIZ_TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleType(o.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${qTypes.includes(o.value) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {genButton("Сгенерировать тест")}
            {quizText && (
              <div className="space-y-3">
                <Textarea value={quizText} onChange={(e) => setQuizText(e.target.value)} rows={10} />
                {indicatorPicker}
                <Button className="w-full gap-2" onClick={addQuiz}><Icon name="Plus" size={16} />Добавить тест в КОС</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="task" className="space-y-3.5 mt-4">
            {topicField()}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Цель (необязательно)</label>
              <Input value={taskGoal} onChange={(e) => setTaskGoal(e.target.value)} placeholder="Что должен уметь обучающийся" />
            </div>
            {genButton("Сгенерировать задания")}
            {taskText && (
              <div className="space-y-3">
                <Textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} rows={10} />
                {indicatorPicker}
                <Button className="w-full gap-2" onClick={addTask}><Icon name="Plus" size={16} />Добавить задания в КОС</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pm" className="space-y-3.5 mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Код ПМ</label>
                <Input value={pmCode} onChange={(e) => setPmCode(e.target.value)} placeholder="ПМ.01" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Наименование ПМ</label>
                <Input value={pmName} onChange={(e) => setPmName(e.target.value)} placeholder="Разработка модулей ПО" />
              </div>
            </div>
            {topicField("Тема МДК")}
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Тип</label>
                <Select value={pmType} onValueChange={setPmType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PM_TASK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Уровень</label>
                <Select value={pmLevel} onValueChange={setPmLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PM_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Количество</label>
                <Input type="number" min={1} max={10} value={pmCount} onChange={(e) => setPmCount(e.target.value)} />
              </div>
            </div>
            {genButton("Сгенерировать задания по ПМ")}
            {!canUsePaid && <p className="text-center text-xs text-muted-foreground">Задания по ПМ доступны по подписке.</p>}
            {pmTasks.length > 0 && (
              <div className="space-y-3">
                {pmTasks.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 text-sm">
                    <div className="font-semibold mb-1">{t.name}</div>
                    <div className="whitespace-pre-wrap text-muted-foreground">{t.description}</div>
                  </div>
                ))}
                {indicatorPicker}
                <Button className="w-full gap-2" onClick={() => finish(pmTasks)}><Icon name="Plus" size={16} />Добавить в КОС ({pmTasks.length})</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default KosImportDialog;
