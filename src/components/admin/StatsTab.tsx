import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { adminGet } from "@/lib/adminApi";

interface Geo {
  visitors: { country: string; count: number }[];
  registered: { country: string; count: number }[];
  paid: { country: string; count: number }[];
  cities: { country: string; city: string; count: number }[];
}

const PERIODS = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "all", label: "Всё время" },
];

interface Stats {
  today: { views: number; visitors: number };
  week: { views: number; visitors: number };
  month: { views: number; visitors: number };
  total: { views: number; visitors: number };
  online: number;
  daily: { date: string; views: number; visitors: number }[];
  top_pages: { path: string; views: number }[];
  sources: { source: string; views: number }[];
  users_total: number;
  users_week: number;
  paid_users: number;
  single_payments: { total: number; amount: number; week: number; month: number; buyers: number };
}

const Metric = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <Card className="p-4">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
  </Card>
);

const GeoList = ({ title, items }: { title: string; items: { country: string; count: number }[] }) => (
  <Card className="p-4">
    <h3 className="font-semibold mb-3">{title}</h3>
    <ul className="space-y-2 text-sm">
      {items.map((g) => (
        <li key={g.country} className="flex justify-between gap-3">
          <span className="truncate">{g.country}</span>
          <span className="font-semibold">{g.count}</span>
        </li>
      ))}
      {items.length === 0 && <li className="text-muted-foreground">Пока нет данных</li>}
    </ul>
  </Card>
);

const StatsTab = ({ token }: { token: string }) => {
  const [s, setS] = useState<Stats | null>(null);
  const [period, setPeriod] = useState("30d");
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    adminGet("stats", token).then(setS).catch(() => {});
  }, [token]);

  useEffect(() => {
    setGeo(null);
    adminGet("geo", token, { period }).then(setGeo).catch(() => {});
  }, [token, period]);

  if (!s) return <p className="text-muted-foreground">Загрузка...</p>;

  const max = Math.max(1, ...s.daily.map((d) => d.views));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Metric label="Сейчас на сайте" value={s.online} hint="За последние 5 минут" />
        <Metric label="Всего посетителей" value={s.total.visitors} hint={`Просмотров: ${s.total.views}`} />
        <Metric label="Посетителей сегодня" value={s.today.visitors} hint={`Просмотров: ${s.today.views}`} />
        <Metric label="Посетителей за 7 дней" value={s.week.visitors} hint={`Просмотров: ${s.week.views}`} />
        <Metric label="Посетителей за 30 дней" value={s.month.visitors} hint={`Просмотров: ${s.month.views}`} />
        <Metric label="Зарегистрировано" value={s.users_total} hint={`За неделю: +${s.users_week}`} />
        <Metric label="Платных подписчиков" value={s.paid_users} />
        <Metric
          label="Разовых платежей"
          value={s.single_payments.total}
          hint={`Покупателей: ${s.single_payments.buyers} · на сумму ${s.single_payments.amount} ₽`}
        />
        <Metric label="Разовых за 7 дней" value={s.single_payments.week} />
        <Metric label="Разовых за 30 дней" value={s.single_payments.month} />
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

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">География</h2>
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {!geo ? (
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              <GeoList title="Посетители по странам" items={geo.visitors} />
              <GeoList title="Зарегистрированные по странам" items={geo.registered} />
              <GeoList title="Оплатившие по странам" items={geo.paid} />
            </div>
            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-3">Города посетителей</h3>
              <ul className="space-y-2 text-sm">
                {geo.cities.map((c) => (
                  <li key={`${c.country}-${c.city}`} className="flex justify-between gap-3">
                    <span className="truncate">
                      {c.city}, {c.country}
                    </span>
                    <span className="font-semibold">{c.count}</span>
                  </li>
                ))}
                {geo.cities.length === 0 && <li className="text-muted-foreground">Пока нет данных</li>}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsTab;