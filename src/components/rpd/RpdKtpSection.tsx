import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { RpdData, RpdKtpRow, emptyKtpRow, ktpTotals, num } from "./rpdConfig";

interface Props {
  data: RpdData;
  patch: (p: Partial<RpdData>) => void;
  aiLoading: boolean;
  onGenerate: () => void;
}

const NUM_FIELDS: [keyof RpdKtpRow, string][] = [
  ["total", "Всего"],
  ["lect", "Лек."],
  ["pract", "Практ."],
  ["lab", "Лаб."],
  ["self", "СРС"],
];

const RpdKtpSection = ({ data, patch, aiLoading, onGenerate }: Props) => {
  const totals = ktpTotals(data.ktp);

  const update = (id: number, p: Partial<RpdKtpRow>) =>
    patch({ ktp: data.ktp.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const updateHours = (id: number, key: keyof RpdKtpRow, value: string) =>
    patch({
      ktp: data.ktp.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, [key]: num(value) } as RpdKtpRow;
        if (key !== "total") next.total = num(next.lect) + num(next.pract) + num(next.lab) + num(next.self);
        return next;
      }),
    });

  const remove = (id: number) => {
    const rest = data.ktp.filter((r) => r.id !== id);
    patch({ ktp: rest.length ? rest : [emptyKtpRow()] });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold mb-1">3. Календарно-тематический план</h2>
          <p className="text-xs text-muted-foreground">ИИ распределит часы по темам так, чтобы суммы совпали с объёмом из раздела 2.</p>
        </div>
        <Button className="gap-2" onClick={onGenerate} disabled={aiLoading}>
          <Icon name={aiLoading ? "Loader2" : "Sparkles"} size={16} className={aiLoading ? "animate-spin" : ""} />
          {aiLoading ? "ИИ работает..." : "Составить КТП с ИИ"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground text-xs">
              <th className="p-2 w-10">№</th>
              <th className="p-2 text-left">Тема / раздел</th>
              {NUM_FIELDS.map(([, label]) => (
                <th key={label} className="p-2 w-20">
                  {label}
                </th>
              ))}
              <th className="p-2 w-44 text-left">Вид контроля</th>
              <th className="p-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {data.ktp.map((r, i) => (
              <tr key={r.id} className="border-b border-border">
                <td className="p-2 text-center font-semibold text-muted-foreground">{i + 1}</td>
                <td className="p-1.5">
                  <Input value={r.topic} onChange={(e) => update(r.id, { topic: e.target.value })} placeholder="Тема / раздел" aria-label="Тема" />
                </td>
                {NUM_FIELDS.map(([key]) => (
                  <td key={key} className="p-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={r[key] as number}
                      onChange={(e) => updateHours(r.id, key, e.target.value)}
                      className="text-center px-1"
                      aria-label={key}
                    />
                  </td>
                ))}
                <td className="p-1.5">
                  <Input value={r.control} onChange={(e) => update(r.id, { control: e.target.value })} placeholder="Тест, КР..." aria-label="Вид контроля" />
                </td>
                <td className="p-1.5">
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => remove(r.id)} aria-label="Удалить строку">
                    <Icon name="X" size={15} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/10 font-semibold">
              <td className="p-2" colSpan={2}>
                ИТОГО
              </td>
              <td className="p-2 text-center">{totals.total}</td>
              <td className="p-2 text-center">{totals.lect}</td>
              <td className="p-2 text-center">{totals.pract}</td>
              <td className="p-2 text-center">{totals.lab}</td>
              <td className="p-2 text-center">{totals.self}</td>
              <td className="p-2" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <Button variant="outline" size="sm" className="gap-1.5 mt-4" onClick={() => patch({ ktp: [...data.ktp, emptyKtpRow()] })}>
        <Icon name="Plus" size={15} />
        Добавить строку
      </Button>
    </section>
  );
};

export default RpdKtpSection;
