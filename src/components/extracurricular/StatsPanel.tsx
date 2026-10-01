import { useMemo } from "react";
import { EventRow, pct, levelOf } from "./types";

interface Props {
  rows: EventRow[];
}

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-3">
    <span className="w-40 shrink-0 text-right text-xs text-muted-foreground truncate">{label}</span>
    <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full flex items-center justify-end pr-2.5 text-[11px] font-bold text-white transition-all"
        style={{ width: `${max > 0 ? Math.max((value / max) * 100, 8) : 8}%`, background: color }}
      >
        {value}
      </div>
    </div>
  </div>
);

const StatsPanel = ({ rows }: Props) => {
  const stats = useMemo(() => {
    const totalEvents = rows.length;
    const totalParticipants = rows.reduce((s, r) => s + r.participants, 0);
    const totalCapacity = rows.reduce((s, r) => s + r.total, 0);
    const avgPct = totalCapacity > 0 ? ((totalParticipants / totalCapacity) * 100).toFixed(1) : "0";

    const byType: Record<string, number> = {};
    rows.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    const byYear: Record<string, { events: number; participants: number; capacity: number }> = {};
    rows.forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = { events: 0, participants: 0, capacity: 0 };
      byYear[r.year].events++;
      byYear[r.year].participants += r.participants;
      byYear[r.year].capacity += r.total;
    });

    let high = 0;
    let mid = 0;
    let low = 0;
    rows.forEach((r) => {
      const lvl = levelOf(pct(r));
      if (lvl === "high") high++;
      else if (lvl === "mid") mid++;
      else low++;
    });

    return { totalEvents, totalParticipants, avgPct, byType, byYear, high, mid, low, typesCount: Object.keys(byType).length };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
        Добавьте мероприятия, чтобы увидеть статистику
      </div>
    );
  }

  const cards = [
    { value: stats.totalEvents, label: "Мероприятий", bg: "from-[#1a5276] to-[#2980b9]" },
    { value: stats.totalParticipants, label: "Участников суммарно", bg: "from-[#1e8449] to-[#27ae60]" },
    { value: `${stats.avgPct}%`, label: "Средняя вовлечённость", bg: "from-[#d35400] to-[#f39c12]" },
    { value: stats.typesCount, label: "Видов деятельности", bg: "from-[#922b21] to-[#e74c3c]" },
  ];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 text-center text-white bg-gradient-to-br ${c.bg} shadow-md`}>
            <p className="font-display text-3xl font-extrabold leading-tight">{c.value}</p>
            <p className="text-xs opacity-90 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-primary mb-3">Распределение по уровню вовлечённости</h3>
        <div className="space-y-2">
          <Bar label="Высокая (≥75%)" value={stats.high} max={stats.totalEvents} color="linear-gradient(90deg,#1e8449,#27ae60)" />
          <Bar label="Средняя (40–74%)" value={stats.mid} max={stats.totalEvents} color="linear-gradient(90deg,#d35400,#f39c12)" />
          <Bar label="Низкая (<40%)" value={stats.low} max={stats.totalEvents} color="linear-gradient(90deg,#922b21,#e74c3c)" />
        </div>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-primary mb-3">Виды внеаудиторной деятельности</h3>
        <div className="space-y-2">
          {Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={stats.totalEvents} color="linear-gradient(90deg,#1a5276,#2980b9)" />
            ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-base font-bold text-primary mb-3">Охват по учебным годам</h3>
        <div className="space-y-2">
          {Object.entries(stats.byYear).map(([k, v]) => {
            const p = v.capacity > 0 ? Math.round((v.participants / v.capacity) * 100) : 0;
            return (
              <Bar
                key={k}
                label={`${k} · ${v.events} мер.`}
                value={p}
                max={100}
                color="linear-gradient(90deg,#5b21b6,#7c3aed)"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
