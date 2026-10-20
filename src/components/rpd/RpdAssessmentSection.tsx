import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import RpdField from "./RpdField";
import { RpdData } from "./rpdConfig";

interface Props {
  data: RpdData;
  patch: (p: Partial<RpdData>) => void;
  aiLoading: boolean;
  onGenerate: () => void;
}

const FIELDS: [keyof RpdData, string, string][] = [
  ["currentControl", "Текущий контроль", "Тесты, контрольные работы, коллоквиумы, рефераты, проекты"],
  ["intermediateControl", "Промежуточная аттестация", "Экзаменационные вопросы, билеты, защита проекта"],
  ["criteria", "Критерии оценивания", "Отлично / хорошо / удовлетворительно / неудовлетворительно"],
  ["sampleTasks", "Типовые контрольные задания и вопросы", "Примеры заданий для текущего и промежуточного контроля"],
  ["evalMethods", "Процедуры оценивания", "Как проводится экзамен, зачёт и т.д."],
];

const RpdAssessmentSection = ({ data, patch, aiLoading, onGenerate }: Props) => (
  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="font-display text-lg font-bold mb-1">4. Оценочные средства</h2>
        <p className="text-xs text-muted-foreground">ИИ учтёт структуру дисциплины, компетенции и форму аттестации.</p>
      </div>
      <Button className="gap-2" onClick={onGenerate} disabled={aiLoading}>
        <Icon name={aiLoading ? "Loader2" : "Sparkles"} size={16} className={aiLoading ? "animate-spin" : ""} />
        {aiLoading ? "ИИ работает..." : "Составить с ИИ"}
      </Button>
    </div>
    <div className="space-y-4">
      {FIELDS.map(([key, label, placeholder]) => (
        <RpdField key={key} label={label}>
          <Textarea rows={4} value={data[key] as string} onChange={(e) => patch({ [key]: e.target.value } as Partial<RpdData>)} placeholder={placeholder} />
        </RpdField>
      ))}
    </div>
  </section>
);

export default RpdAssessmentSection;
