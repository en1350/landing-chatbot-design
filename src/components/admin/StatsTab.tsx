import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/adminApi";

interface Stats {
  today: { views: number; visitors: number };
  week: { views: number; visitors: number };
  month: { views: number; visitors: number };
  daily: { date: string; views: number; visitors: number }[];
  top_pages: { path: string; views: number }[];
  sources: { source: string; views: number }[];
  users_total: number;
  users_week: number;
  paid_users: number;
}

const Metric = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <Card className="p-4">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
  </Card>
);

const StatsTab = ({ token }: { token: string }) => {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    adminGet("stats", token).then(setS).catch(() => {});
  }, [token]);

  if (!s) return <p className="text-muted-foreground">Загрузка...</p>;

  const max = Math.max(1, ...s.daily.map((d) => d.views));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Metric label="Посетителей сегодня" value={s.today.visitors} hint={`Просмотров: ${s.today.views}`} />
        <Metric label="Посетителей за 7 дней" value={s.week.visitors} hint={`Просмотров: ${s.week.views}`} />
        <Metric label="Посетителей за 30 дней" value={s.month.visitors} hint={`Просмотров: ${s.month.views}`} />
        <Metric label="Зарегистрировано" value={s.users_total} hint={`За неделю: +${s.users_week}`} />
        <Metric label="Платных подписчиков" value={s.paid_users} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Просмотры за 14 дней</h3>
        <div className="flex items-end gap-1.5 h-40">
          {s.daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] text-muted-foreground">{d.views}</span>
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${(d.views / max) * 100}%`, minHeight: 2 }}
                title={`${d.date}: ${d.visitors} посетителей`}
              />
              <span className="text-[10px] text-muted-foreground">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Популярные страницы (30 дней)</h3>
          <ul className="space-y-2 text-sm">
            {s.top_pages.map((p) => (
              <li key={p.path} className="flex justify-between gap-3">
                <span className="truncate">{p.path}</span>
                <span className="font-semibold">{p.views}</span>
              </li>
            ))}
            {s.top_pages.length === 0 && <li className="text-muted-foreground">Пока нет данных</li>}
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Откуда приходят (30 дней)</h3>
          <ul className="space-y-2 text-sm">
            {s.sources.map((p) => (
              <li key={p.source} className="flex justify-between gap-3">
                <span className="truncate">{p.source}</span>
                <span className="font-semibold">{p.views}</span>
              </li>
            ))}
            {s.sources.length === 0 && <li className="text-muted-foreground">Пока нет данных</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default StatsTab;
