import { FGOS_LABELS, INSTITUTIONS, type Stage } from "./lessonCardConfig";

export interface PreviewData {
  institution: string;
  fgos: string;
  classNum: string;
  courseNum: string;
  pm: string;
  mdk: string;
  discipline: string;
  specialty: string;
  group: string;
  teacher: string;
  topic: string;
  goal: string;
  taskEducational: string;
  taskDeveloping: string;
  taskUpbringing: string;
  technologies: string[];
  lessonType: string;
  lessonForm: string;
  intersubject: string;
  intrasubject: string;
  materials: string;
  sources: string;
  uud: string;
  competencies: string[];
  pk: string;
  stages: Stage[];
}

interface Props {
  data: PreviewData;
}

const dash = (v: string) => (v.trim() ? v : "—");

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <tr>
    <td className="w-[32%] border border-slate-300 bg-slate-100 px-3 py-2 align-top font-semibold">{label}</td>
    <td className="border border-slate-300 px-3 py-2 align-top whitespace-pre-wrap">{children}</td>
  </tr>
);

const LessonCardPreview = ({ data }: Props) => {
  const isSchool = data.institution === "school";
  const isCollege = data.institution === "college";
  const total = data.stages.reduce((sum, s) => sum + (s.time || 0), 0);
  const institutionLabel = INSTITUTIONS.find((i) => i.value === data.institution)?.label || "";

  return (
    <div id="lesson-card-print" className="rounded-xl border-2 border-primary/60 bg-white p-4 md:p-6 text-[#1e1b4b] text-sm">
      <div className="rounded-lg bg-[#1e3c72] text-white text-center px-4 py-4 mb-5">
        <h3 className="font-display text-lg md:text-xl font-bold">Технологическая карта учебного занятия</h3>
        <p className="mt-1">Преподаватель: {dash(data.teacher)}</p>
      </div>

      <h4 className="font-bold text-base text-[#1e3c72] border-b-[3px] border-[#2a5298] pb-1.5 mb-3">
        1. Общие сведения о занятии
      </h4>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Тип учреждения">{institutionLabel}</Row>
          <Row label="ФГОС">{FGOS_LABELS[data.fgos] || "—"}</Row>
          <Row label="Класс / Курс">{isSchool ? `${data.classNum} класс` : `${data.courseNum} курс`}</Row>
          {isCollege && (
            <Row label="ПМ, МДК">
              <b>ПМ:</b> {dash(data.pm)}
              {"\n"}
              <b>МДК:</b> {dash(data.mdk)}
            </Row>
          )}
          <Row label="Предмет / Дисциплина">{dash(data.discipline)}</Row>
          {!isSchool && <Row label="Специальность">{dash(data.specialty)}</Row>}
          {data.group.trim() && <Row label="Группа">{data.group}</Row>}
          <Row label="Тема учебного занятия">{dash(data.topic)}</Row>
          <Row label="Цель учебного занятия">{dash(data.goal)}</Row>
          <Row label="Задачи учебного занятия">
            <b>1. Образовательная:</b> {dash(data.taskEducational)}
            {"\n"}
            <b>2. Развивающая:</b> {dash(data.taskDeveloping)}
            {"\n"}
            <b>3. Воспитательная:</b> {dash(data.taskUpbringing)}
          </Row>
          <Row label="Используемые педагогические технологии">
            {data.technologies.length ? data.technologies.join(", ") : "—"}
          </Row>
          <Row label="Тип учебного занятия">{data.lessonType}</Row>
          <Row label="Форма организации учебного занятия">{data.lessonForm}</Row>
          <Row label="Межпредметные связи">{dash(data.intersubject)}</Row>
          <Row label="Внутрипредметные связи">{dash(data.intrasubject)}</Row>
          <Row label="Информационное обеспечение">{dash(data.materials)}</Row>
          <Row label="Формируемые компетенции">
            {isSchool ? (
              <>
                <b>Формируемые УУД:</b>
                {"\n"}
                {dash(data.uud)}
              </>
            ) : (
              <>
                <b>ОК:</b>
                {"\n"}
                {data.competencies.length ? data.competencies.join("\n") : "—"}
                {"\n\n"}
                <b>ПК:</b>
                {"\n"}
                {dash(data.pk)}
              </>
            )}
          </Row>
          <Row label="Используемые источники информации">{dash(data.sources)}</Row>
        </tbody>
      </table>

      <h4 className="font-bold text-base text-[#1e3c72] border-b-[3px] border-[#2a5298] pb-1.5 mb-2">
        2. Организационная структура учебного занятия
      </h4>
      <p className="text-slate-500 mb-3">
        <b>Общая продолжительность:</b> {total} мин.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-[#1e3c72] text-white">
              <th className="border border-slate-300 px-3 py-2 w-[15%]">Этап занятия</th>
              <th className="border border-slate-300 px-3 py-2 w-[8%]">Время</th>
              <th className="border border-slate-300 px-3 py-2 w-[17%]">Цель этапа</th>
              <th className="border border-slate-300 px-3 py-2 w-[25%]">Деятельность преподавателя</th>
              <th className="border border-slate-300 px-3 py-2 w-[22%]">Деятельность обучающегося, форма организации</th>
              <th className="border border-slate-300 px-3 py-2 w-[13%]">Формируемые компетенции</th>
            </tr>
          </thead>
          <tbody>
            {data.stages.map((s) => (
              <tr key={s.id}>
                <td className="border border-slate-300 px-3 py-2 align-top font-bold">{s.name}</td>
                <td className="border border-slate-300 px-3 py-2 align-top text-center font-bold text-red-700">
                  {s.time} мин.
                </td>
                <td className="border border-slate-300 bg-blue-50 px-3 py-2 align-top font-bold italic text-blue-900">
                  {s.purpose}
                </td>
                <td className="border border-slate-300 px-3 py-2 align-top whitespace-pre-wrap">{s.teacher}</td>
                <td className="border border-slate-300 px-3 py-2 align-top whitespace-pre-wrap">{s.student}</td>
                <td className="border border-slate-300 px-3 py-2 align-top text-xs text-slate-600">{s.competency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-6 pt-3 border-t-2 border-slate-300 text-slate-500 text-xs">
        <p>
          Технологическая карта разработана преподавателем <b>{dash(data.teacher)}</b>
        </p>
        <p>Дата: «___» ____________ 20___ г.</p>
      </div>
    </div>
  );
};

export default LessonCardPreview;
