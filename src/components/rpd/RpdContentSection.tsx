import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import RpdField from "./RpdField";
import { RpdCompetency, RpdData, emptyCompetency, hoursTotal } from "./rpdConfig";

interface Props {
  data: RpdData;
  patch: (p: Partial<RpdData>) => void;
  aiLoading: boolean;
  onGenerate: () => void;
}

const HOURS: [keyof RpdData, string][] = [
  ["hoursLecture", "Лекции"],
  ["hoursPractice", "Практические занятия"],
  ["hoursLab", "Лабораторные работы"],
  ["hoursSelf", "Самостоятельная работа"],
  ["hoursControl", "Контроль (экзамен / зачёт)"],
];

const RpdContentSection = ({ data, patch, aiLoading, onGenerate }: Props) => {
  const updateComp = (id: number, p: Partial<RpdCompetency>) =>
    patch({ competencies: data.competencies.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const removeComp = (id: number) => {
    const rest = data.competencies.filter((c) => c.id !== id);
    patch({ competencies: rest.length ? rest : [emptyCompetency()] });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold mb-1">2. Цель, задачи, компетенции и содержание</h2>
          <p className="text-xs text-muted-foreground">ИИ предложит цель, задачи, компетенции, структуру тем и пререквизиты.</p>
        </div>
        <Button className="gap-2" onClick={onGenerate} disabled={aiLoading}>
          <Icon name={aiLoading ? "Loader2" : "Sparkles"} size={16} className={aiLoading ? "animate-spin" : ""} />
          {aiLoading ? "ИИ работает..." : "Составить с ИИ"}
        </Button>
      </div>

      <div className="space-y-4">
        <RpdField label="Цель дисциплины">
          <Textarea rows={3} value={data.goal} onChange={(e) => patch({ goal: e.target.value })} placeholder="Основная цель освоения дисциплины" />
        </RpdField>
        <RpdField label="Задачи дисциплины (каждая с новой строки)">
          <Textarea rows={4} value={data.tasks} onChange={(e) => patch({ tasks: e.target.value })} />
        </RpdField>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Компетенции и оценочные средства</label>
          <div className="space-y-2">
            {data.competencies.map((c) => (
              <div key={c.id} className="grid gap-2 md:grid-cols-[120px_1fr_1fr_40px] items-start">
                <Input value={c.code} onChange={(e) => updateComp(c.id, { code: e.target.value })} placeholder="УК-1" aria-label="Код компетенции" />
                <Textarea rows={2} value={c.text} onChange={(e) => updateComp(c.id, { text: e.target.value })} placeholder="Формулировка компетенции" aria-label="Формулировка компетенции" />
                <Input value={c.tool} onChange={(e) => updateComp(c.id, { tool: e.target.value })} placeholder="Оценочное средство" aria-label="Оценочное средство" />
                <Button variant="outline" size="icon" className="text-destructive" onClick={() => removeComp(c.id)} aria-label="Удалить компетенцию">
                  <Icon name="X" size={15} />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 mt-3" onClick={() => patch({ competencies: [...data.competencies, emptyCompetency()] })}>
            <Icon name="Plus" size={15} />
            Добавить компетенцию
          </Button>
        </div>

        <RpdField label="Структура дисциплины (разделы и темы)">
          <Textarea
            rows={7}
            value={data.structure}
            onChange={(e) => patch({ structure: e.target.value })}
            placeholder={"Раздел 1. Название\nТема 1.1. Название\nТема 1.2. Название"}
          />
        </RpdField>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Объём дисциплины по видам учебной работы (часы)</label>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {HOURS.map(([key, label]) => (
              <div key={key}>
                <span className="text-xs text-muted-foreground block mb-1">{label}</span>
                <Input type="number" min={0} value={data[key] as string} onChange={(e) => patch({ [key]: e.target.value } as Partial<RpdData>)} placeholder="0" />
              </div>
            ))}
            <div>
              <span className="text-xs font-semibold block mb-1">ИТОГО</span>
              <Input readOnly value={hoursTotal(data)} className="bg-primary/10 font-semibold" aria-label="Итого часов" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RpdContentSection;
