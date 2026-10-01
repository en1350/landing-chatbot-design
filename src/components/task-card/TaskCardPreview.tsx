export interface TaskPreviewData {
  discipline: string;
  group: string;
  topic: string;
  goal: string;
  task: string;
  criteria: string;
  time: string;
  taskType: string;
  selfAssessment: string;
  competencies: string[];
}

interface Props {
  data: TaskPreviewData;
}

const TaskCardPreview = ({ data }: Props) => (
  <div id="task-card-print" className="rounded-xl border-2 border-primary/60 bg-white p-6 md:p-8 text-[#1e1b4b]">
    <div className="text-center border-b-2 border-dashed border-border pb-4 mb-5">
      <h3 className="font-display text-xl md:text-2xl font-bold text-primary">
        {data.topic.trim() || "Тема задания не указана"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        {(data.discipline.trim() || "Дисциплина не указана") + " | " + (data.group.trim() || "Группа не указана")}
      </p>
    </div>

    <div className="grid gap-2 sm:grid-cols-3 mb-5 text-sm">
      <div className="rounded-lg bg-primary/10 px-3 py-2">
        <span className="font-semibold text-primary">Время:</span> {data.time}
      </div>
      <div className="rounded-lg bg-primary/10 px-3 py-2">
        <span className="font-semibold text-primary">Тип:</span> {data.taskType}
      </div>
      <div className="rounded-lg bg-primary/10 px-3 py-2">
        <span className="font-semibold text-primary">Самооценка:</span> {data.selfAssessment}
      </div>
    </div>

    <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">🎯 Цель задания</div>
    <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
      {data.goal.trim() || <span className="italic text-muted-foreground">Цель не сформулирована</span>}
    </p>

    <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">📝 Текст задания</div>
    <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
      {data.task.trim() || (
        <span className="italic text-muted-foreground">
          Текст задания не введён — заполните вручную или нажмите «Заполнить с помощью ИИ»
        </span>
      )}
    </p>

    {data.criteria.trim() && (
      <>
        <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">⚖️ Критерии оценки</div>
        <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
          {data.criteria}
        </p>
      </>
    )}

    <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">🏆 Формируемые компетенции</div>
    {data.competencies.length === 0 ? (
      <p className="text-sm italic text-muted-foreground">Не выбраны</p>
    ) : (
      <ul className="space-y-1.5">
        {data.competencies.map((c) => (
          <li key={c} className="relative pl-5 text-sm leading-snug">
            <span className="absolute left-0 font-bold text-emerald-600">✔</span>
            {c}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default TaskCardPreview;
