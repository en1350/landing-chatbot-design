import { RpdData, hoursTotal, ktpTotals } from "./rpdConfig";
import { RPD_TITLE } from "./rpdText";

interface Props {
  data: RpdData;
}

const dash = (v: string) => v.trim() || "—";
const list = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

const H2 = ({ children }: { children: string }) => (
  <h2 className="mt-5 mb-2 border-b border-black pb-1 text-[13pt] font-bold">{children}</h2>
);
const H3 = ({ children }: { children: string }) => <h3 className="mt-3 mb-1 text-[12pt] font-bold">{children}</h3>;
const Text = ({ value }: { value: string }) => <p className="whitespace-pre-wrap text-justify">{dash(value)}</p>;
const Items = ({ value }: { value: string }) => {
  const items = list(value);
  return items.length ? (
    <ul className="ml-6 list-disc">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  ) : (
    <p>—</p>
  );
};

const cell = "border border-black px-1.5 py-1 text-left align-top";

const RpdPreview = ({ data: d }: Props) => {
  const ktp = d.ktp.filter((r) => r.topic.trim());
  const comps = d.competencies.filter((c) => c.code.trim() || c.text.trim());
  const t = ktpTotals(d.ktp);

  return (
    <div
      id="rpd-print"
      className="rounded-xl border border-border bg-white p-6 sm:p-10 text-black text-[11.5pt] leading-relaxed"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <h1 className="mb-3 text-center text-[16pt] font-bold uppercase">{RPD_TITLE}</h1>
      <p className="text-center font-bold">{dash(d.disciplineName)}</p>
      <p className="mb-4 text-center">Код: {dash(d.disciplineCode)}</p>

      <div className="mb-3 border-l-[3px] border-slate-700 bg-slate-50 p-3">
        <p><b>ФГОС:</b> {dash(d.fgos)}</p>
        <p><b>Направление подготовки:</b> {dash(d.direction)}</p>
        <p><b>Образовательная программа:</b> {dash(d.programName)}</p>
        <p><b>Профиль:</b> {dash(d.profile)}</p>
        <p><b>Курс:</b> {dash(d.course)}, <b>семестр:</b> {dash(d.semester)}</p>
        <p><b>Общая трудоёмкость:</b> {d.totalHours || 0} ч. ({d.credits || 0} ЗЕ)</p>
        <p><b>Промежуточная аттестация:</b> {dash(d.attestationType)}</p>
        <p><b>Язык обучения:</b> {dash(d.language)}</p>
      </div>

      <H2>1. Цель дисциплины</H2>
      <Text value={d.goal} />

      <H2>2. Задачи дисциплины</H2>
      <Items value={d.tasks} />

      <H2>3. Планируемые результаты обучения (компетенции)</H2>
      {comps.length ? (
        <table className="my-2 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr className="bg-gray-100">
              <th className={cell}>Код</th>
              <th className={cell}>Компетенция</th>
              <th className={cell}>Оценочное средство</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((c) => (
              <tr key={c.id}>
                <td className={cell}>{c.code}</td>
                <td className={cell}>{c.text}</td>
                <td className={cell}>{c.tool}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>—</p>
      )}

      <H2>4. Место дисциплины в структуре ОП</H2>
      <p><b>Пререквизиты:</b> {dash(d.prereq)}</p>
      <p><b>Постреквизиты:</b> {dash(d.postreq)}</p>

      <H2>5. Структура и содержание дисциплины</H2>
      <Text value={d.structure} />
      <H3>Объём дисциплины по видам учебной работы</H3>
      <table className="my-2 w-full border-collapse text-[10.5pt]">
        <thead>
          <tr className="bg-gray-100">
            <th className={cell}>Вид учебной работы</th>
            <th className={cell}>Часы</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Лекции", d.hoursLecture],
            ["Практические занятия", d.hoursPractice],
            ["Лабораторные работы", d.hoursLab],
            ["Самостоятельная работа", d.hoursSelf],
            ["Контроль", d.hoursControl],
          ].map(([label, v]) => (
            <tr key={label}>
              <td className={cell}>{label}</td>
              <td className={cell}>{v || 0}</td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td className={cell}>ИТОГО</td>
            <td className={cell}>{hoursTotal(d)}</td>
          </tr>
        </tbody>
      </table>

      <H2>6. Календарно-тематический план</H2>
      {ktp.length ? (
        <table className="my-2 w-full border-collapse text-[10pt]">
          <thead>
            <tr className="bg-gray-100">
              {["№", "Тема", "Всего", "Лек.", "Практ.", "Лаб.", "СРС", "Контроль"].map((h) => (
                <th key={h} className={cell}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ktp.map((r, i) => (
              <tr key={r.id}>
                <td className={cell}>{i + 1}</td>
                <td className={cell}>{r.topic}</td>
                <td className={cell}>{r.total}</td>
                <td className={cell}>{r.lect}</td>
                <td className={cell}>{r.pract}</td>
                <td className={cell}>{r.lab}</td>
                <td className={cell}>{r.self}</td>
                <td className={cell}>{r.control}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td className={cell} colSpan={2}>ИТОГО</td>
              <td className={cell}>{t.total}</td>
              <td className={cell}>{t.lect}</td>
              <td className={cell}>{t.pract}</td>
              <td className={cell}>{t.lab}</td>
              <td className={cell}>{t.self}</td>
              <td className={cell} />
            </tr>
          </tbody>
        </table>
      ) : (
        <p>—</p>
      )}

      <H2>7. Оценочные средства</H2>
      <H3>Текущий контроль</H3>
      <Text value={d.currentControl} />
      <H3>Промежуточная аттестация</H3>
      <Text value={d.intermediateControl} />
      <H3>Критерии оценивания</H3>
      <Text value={d.criteria} />
      <H3>Типовые контрольные задания</H3>
      <Text value={d.sampleTasks} />
      <H3>Процедуры оценивания</H3>
      <Text value={d.evalMethods} />

      <H2>8. Учебно-методическое обеспечение</H2>
      <H3>Основная литература</H3>
      <Items value={d.mainLit} />
      <H3>Дополнительная литература</H3>
      <Items value={d.addLit} />
      <H3>Электронные образовательные ресурсы</H3>
      <Items value={d.eResources} />
      <H3>Программное обеспечение</H3>
      <Text value={d.software} />
      <H3>Информационные справочные системы</H3>
      <Text value={d.infoSystems} />
      <H3>Материально-техническое обеспечение</H3>
      <Text value={d.materials} />

      <H2>9. Разработчик РПД</H2>
      <p><b>{dash(d.developer)}</b>, {dash(d.developerPosition)}</p>
      <p>{dash(d.organization)}, {dash(d.department)}</p>
      <p className="mt-6 text-right">Утверждена: {dash(d.approvalYear)} г.</p>
    </div>
  );
};

export default RpdPreview;
