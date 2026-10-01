import { STAGES } from "./lessonCardConfig";

export interface PreviewData {
  discipline: string;
  group: string;
  topic: string;
  goal: string;
  duration: string;
  lessonType: string;
  competencies: string[];
  technologies: string[];
  times: Record<string, number>;
  contents: Record<string, string>;
}

interface Props {
  data: PreviewData;
}

const LessonCardPreview = ({ data }: Props) => {
  const filledStages = STAGES.filter((s) => (data.contents[s.key] || "").trim() !== "");

  return (
    <div id="lesson-card-print" className="rounded-xl border-2 border-primary/60 bg-white p-6 md:p-8 text-[#1e1b4b]">
      <div className="text-center border-b-2 border-dashed border-border pb-4 mb-5">
        <h3 className="font-display text-xl md:text-2xl font-bold text-primary">
          {data.topic.trim() || "Тема урока не указана"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {(data.discipline.trim() || "Дисциплина не указана") + " | " + (data.group.trim() || "Группа не указана")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 mb-5 text-sm">
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Время:</span> {data.duration} мин
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Тип:</span> {data.lessonType}
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Этапов:</span> {filledStages.length} из {STAGES.length}
        </div>
      </div>

      <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">🎯 Цель урока</div>
      <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
        {data.goal.trim() || <span className="italic text-muted-foreground">Цель не сформулирована</span>}
      </p>

      <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">🏆 Компетенции</div>
      {data.competencies.length === 0 ? (
        <p className="text-sm italic text-muted-foreground mb-5">Не выбраны</p>
      ) : (
        <ul className="mb-5 space-y-1.5">
          {data.competencies.map((c) => (
            <li key={c} className="relative pl-5 text-sm leading-snug">
              <span className="absolute left-0 font-bold text-emerald-600">✔</span>
              {c}
            </li>
          ))}
        </ul>
      )}

      <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">⚙️ Технологии обучения</div>
      {data.technologies.length === 0 ? (
        <p className="text-sm italic text-muted-foreground mb-5">Не выбраны</p>
      ) : (
        <ul className="mb-5 space-y-1.5">
          {data.technologies.map((t) => (
            <li key={t} className="relative pl-5 text-sm leading-snug">
              <span className="absolute left-0 font-bold text-amber-500">◆</span>
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">📚 Ход урока</div>
      {filledStages.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          Заполните хотя бы один этап урока или нажмите «Заполнить с помощью ИИ»
        </p>
      ) : (
        <div className="space-y-3">
          {STAGES.map((s, i) => {
            const content = (data.contents[s.key] || "").trim();
            if (!content) return null;
            return (
              <div key={s.key} className="rounded-lg border-l-[3px] border-primary bg-primary/5 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-primary text-sm">
                    {i + 1}. {s.name}
                  </span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shrink-0">
                    {data.times[s.key] || 0} мин
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonCardPreview;
