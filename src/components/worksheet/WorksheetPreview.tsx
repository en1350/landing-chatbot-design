import { WorksheetMeta, WorksheetTask } from "./worksheetConfig";

interface Props {
  meta: WorksheetMeta;
  tasks: WorksheetTask[];
}

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];

const TaskBody = ({ task }: { task: WorksheetTask }) => {
  if (task.type === "choice") {
    const options = task.options.filter((o) => o.trim());
    return (
      <div className="mt-1.5 space-y-1">
        {(options.length ? options : ["_______________", "_______________", "_______________"]).map((o, i) => (
          <div key={i}>
            ☐ {LETTERS[i] || i + 1}) {o}
          </div>
        ))}
      </div>
    );
  }
  if (task.type === "table") {
    const cols = task.columns.filter((c) => c.trim());
    const headers = cols.length ? cols : ["", ""];
    return (
      <table className="mt-2 w-full border-collapse text-[11pt]">
        <thead>
          <tr>
            {headers.map((c, i) => (
              <th key={i} className="border border-black bg-gray-100 px-2 py-1 text-left font-bold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: task.rows }).map((_, r) => (
            <tr key={r}>
              {headers.map((_, c) => (
                <td key={c} className="border border-black px-2 py-3" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <div className="mt-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-6 border-b border-dotted border-black" />
      ))}
    </div>
  );
};

const WorksheetPreview = ({ meta, tasks }: Props) => {
  const plan = meta.planText.trim();
  return (
    <div
      id="worksheet-sheet"
      className="mx-auto box-border bg-white text-black shadow-xl"
      style={{ width: "794px", minHeight: "1123px", padding: "72px 64px", fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: 1.5 }}
    >
      <div className="mb-5 border-b-2 border-black pb-2.5 text-center">
        <h2 className="mb-1 text-[18pt] font-bold uppercase leading-tight">{meta.topic.trim() || "Тема урока"}</h2>
        <div>Рабочий лист для самостоятельной работы</div>
      </div>

      <div className="mb-5 flex justify-between gap-4 text-[11pt]">
        <span>Группа: {meta.group.trim() || "_________"}</span>
        <span>Преподаватель: {meta.teacher.trim() || "_________"}</span>
        <span>Дата: «___» __________ 20__ г.</span>
      </div>

      {plan.length > 20 && (
        <div className="mb-5 border-l-[3px] border-sky-500 bg-sky-50 p-2.5 text-[10pt] italic">
          Цель / контекст урока: {plan.slice(0, 150)}
          {plan.length > 150 ? "..." : ""}
        </div>
      )}

      {tasks.map((task, index) => (
        <div key={task.id} className="mb-5" style={{ breakInside: "avoid" }}>
          <h4 className="mb-2 text-[12pt] font-bold">
            Задание {index + 1}. {task.title}
          </h4>
          <div className="ml-4 whitespace-pre-wrap">{task.description}</div>
          <div className="ml-4">
            <TaskBody task={task} />
          </div>
        </div>
      ))}

      <div className="mt-10 text-center text-[10pt] text-gray-500">Желаю успехов в выполнении работы!</div>
    </div>
  );
};

export default WorksheetPreview;
