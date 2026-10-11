import { LEVEL_CLASS, LEVEL_LABEL, PM_TASK_TYPES, PmCriterion, PmTaskItem } from "@/components/pm-task/pmTaskConfig";

export interface PmPreviewData {
  pmCode: string;
  pmName: string;
  mdkCode: string;
  mdkTopic: string;
  vd: string;
  pk: string;
  ok: string;
  taskType: string;
  duration: string;
  controlForm: string;
  instructionText: string;
  tasks: PmTaskItem[];
  criteria: PmCriterion[];
  equipment: string;
  answerKey: string;
  showAnswerKey: boolean;
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <div className="font-bold border-l-4 border-primary pl-2.5 mb-2 mt-5">{children}</div>
);

const PmTaskPreview = ({ data }: { data: PmPreviewData }) => {
  const typeLabel = PM_TASK_TYPES.find((t) => t.value === data.taskType)?.label || data.taskType;
  const dash = (v: string) => v.trim() || "—";

  return (
    <div id="pm-task-print" className="rounded-xl border-2 border-primary/60 bg-white p-6 md:p-8 text-[#1e1b4b]">
      <div className="text-center border-b-2 border-dashed border-border pb-4 mb-5">
        <h3 className="font-display text-xl md:text-2xl font-bold text-primary">{typeLabel}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {data.pmName.trim() ? `${data.pmCode.trim()} ${data.pmName.trim()}`.trim() : "Профессиональный модуль не указан"}
        </p>
      </div>

      <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm space-y-1 mb-4">
        <div><b className="text-primary">МДК:</b> {dash(data.mdkCode)} {data.mdkTopic.trim() && `— ${data.mdkTopic.trim()}`}</div>
        <div><b className="text-primary">ВД:</b> {dash(data.vd)}</div>
        <div><b className="text-primary">ПК:</b> {dash(data.pk)} &nbsp;|&nbsp; <b className="text-primary">ОК:</b> {dash(data.ok)}</div>
        <div><b className="text-primary">Время:</b> {data.duration || "—"} мин. &nbsp;|&nbsp; <b className="text-primary">Форма контроля:</b> {data.controlForm}</div>
      </div>

      {data.instructionText.trim() && (
        <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">{data.instructionText}</p>
      )}

      <Heading>📝 Задания</Heading>
      {data.tasks.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          Заданий пока нет — заполните параметры и нажмите «Сгенерировать с ИИ»
        </p>
      ) : (
        <div className="space-y-3">
          {data.tasks.map((t, i) => (
            <div key={i} className="rounded-r-lg border-l-4 border-primary bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed">
              <div className="mb-1 flex items-center gap-2 font-bold text-primary">
                Задание {i + 1}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_CLASS[t.level]}`}>
                  {LEVEL_LABEL[t.level]}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{t.text}</p>
            </div>
          ))}
        </div>
      )}

      {data.criteria.length > 0 && (
        <>
          <Heading>✅ Критерии оценивания</Heading>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Оценка</th>
                  <th className="border border-border p-2 text-left">Критерий</th>
                  <th className="border border-border p-2 text-left">Соответствие</th>
                </tr>
              </thead>
              <tbody>
                {data.criteria.map((c, i) => (
                  <tr key={i}>
                    <td className="border border-border p-2 font-semibold align-top">{c.grade}</td>
                    <td className="border border-border p-2 align-top">{c.criterion}</td>
                    <td className="border border-border p-2 align-top">{c.match}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data.equipment.trim() && (
        <>
          <Heading>🔧 Материально-техническое обеспечение</Heading>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.equipment}</p>
        </>
      )}

      {data.showAnswerKey && data.answerKey.trim() && (
        <>
          <Heading>🔑 Эталон ответа (для преподавателя)</Heading>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.answerKey}</p>
        </>
      )}
    </div>
  );
};

export default PmTaskPreview;
