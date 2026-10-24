import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { EventRow, pct, levelOf } from "@/components/extracurricular/types";

interface EventsTableProps {
  rows: EventRow[];
  onExportCsv: () => void;
  onRemove: (id: string) => void;
}

const levelClass = (p: number) => {
  const l = levelOf(p);
  return l === "high" ? "text-emerald-600" : l === "mid" ? "text-amber-600" : "text-destructive";
};

const EventsTable = ({ rows, onExportCsv, onRemove }: EventsTableProps) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
    <div className="flex flex-wrap gap-2 mb-4 no-print">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportCsv}>
        <Icon name="FileSpreadsheet" size={15} />
        Экспорт CSV
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
        <Icon name="Printer" size={15} />
        Печать
      </Button>
    </div>

    {rows.length === 0 ? (
      <p className="py-12 text-center text-muted-foreground">
        Данных пока нет — добавьте мероприятия на вкладке «Ввод»
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              {["№", "Год", "Дата", "Дисциплина", "Группа", "Чел.", "Вид", "Описание", "Уч.", "%", ""].map((h) => (
                <th key={h} className="px-2.5 py-2.5 text-left font-semibold whitespace-nowrap first:rounded-l-lg last:rounded-r-lg">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const p = pct(r);
              return (
                <tr key={r.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                  <td className="px-2.5 py-2">{i + 1}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{r.year}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    {r.date ? new Date(r.date).toLocaleDateString("ru-RU") : "—"}
                  </td>
                  <td className="px-2.5 py-2 min-w-[140px] sm:min-w-[180px]">{r.subject}</td>
                  <td className="px-2.5 py-2">{r.group}</td>
                  <td className="px-2.5 py-2">{r.total}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">{r.type}</td>
                  <td className="px-2.5 py-2 min-w-[130px] sm:min-w-[160px]">{r.desc || "—"}</td>
                  <td className="px-2.5 py-2">{r.participants}</td>
                  <td className={`px-2.5 py-2 font-bold ${levelClass(p)}`}>{p.toFixed(1)}%</td>
                  <td className="px-2.5 py-2 no-print">
                    <button
                      onClick={() => onRemove(r.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default EventsTable;
