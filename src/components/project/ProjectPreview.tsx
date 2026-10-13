import { ReactNode } from "react";
import { ProjectPlan, riskLevel } from "./projectTypes";

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-xl border border-border bg-card p-4 sm:p-5 mb-4 break-inside-avoid">
    <h3 className="font-display font-bold text-base mb-3">{title}</h3>
    {children}
  </section>
);

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-muted/60">
          {head.map((h) => (
            <th key={h} className="px-2.5 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border align-top">
            {r.map((c, j) => (
              <td key={j} className="px-2.5 py-2 min-w-[100px]">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BAR_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-purple-500"];

const Gantt = ({ tasks }: { tasks: ProjectPlan["tasks"] }) => {
  const maxWeek = Math.max(...tasks.map((t) => t.endWeek), 4);
  const step = Math.max(1, Math.ceil(maxWeek / 24));
  const cols = Math.ceil(maxWeek / step);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div style={{ minWidth: 220 + cols * 28 }}>
        <div className="flex bg-primary text-primary-foreground text-[11px] font-semibold">
          <div className="w-[180px] shrink-0 px-2 py-2 sticky left-0 bg-primary">Задача</div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }, (_, i) => (
              <div key={i} className="py-2 text-center">{step === 1 ? i + 1 : i * step + 1}</div>
            ))}
          </div>
        </div>
        {tasks.map((t, idx) => {
          const from = Math.floor((t.startWeek - 1) / step);
          const to = Math.floor((t.endWeek - 1) / step);
          return (
            <div key={idx} className="flex items-center border-t border-border text-xs">
              <div className="w-[180px] shrink-0 px-2 py-2 sticky left-0 bg-card font-medium truncate" title={t.name}>
                {t.name}
              </div>
              <div className="flex-1 grid items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                <div
                  className={`h-5 rounded-md ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                  style={{ gridColumn: `${from + 1} / ${to + 2}` }}
                  title={`Недели ${t.startWeek}–${t.endWeek}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="px-2 py-1.5 text-[11px] text-muted-foreground border-t border-border">
        Шкала: {step === 1 ? "недели" : `${step} нед. в одной ячейке`} от начала проекта
      </p>
    </div>
  );
};

const CELL_COLOR = (v: number) =>
  v <= 4 ? "bg-emerald-500" : v <= 9 ? "bg-amber-500" : v <= 16 ? "bg-red-500" : "bg-red-800";

const RiskMatrix = ({ risks }: { risks: ProjectPlan["risks"] }) => (
  <div className="max-w-md">
    <div className="grid grid-cols-5 gap-1">
      {[5, 4, 3, 2, 1].flatMap((p) =>
        [1, 2, 3, 4, 5].map((i) => {
          const here = risks.map((r, n) => ({ r, n })).filter(({ r }) => r.probability === p && r.impact === i);
          return (
            <div
              key={`${p}-${i}`}
              className={`h-11 sm:h-12 rounded-md flex flex-wrap items-center justify-center gap-0.5 p-0.5 ${CELL_COLOR(p * i)}`}
            >
              {here.map(({ n }) => (
                <span key={n} className="bg-white text-foreground rounded px-1 text-[10px] font-bold leading-4">
                  R{n + 1}
                </span>
              ))}
            </div>
          );
        })
      )}
    </div>
    <p className="text-xs text-muted-foreground mt-2">По вертикали — вероятность (сверху выше), по горизонтали — влияние (справа сильнее)</p>
  </div>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <p className="text-sm mb-1.5">
    <span className="font-semibold">{label}: </span>
    {value || "—"}
  </p>
);

const ProjectPreview = ({ plan }: { plan: ProjectPlan }) => (
  <div>
    <div className="mb-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">{plan.name}</h2>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
    </div>

    <Card title="Проблема и целевая аудитория">
      <Field label="Проблема" value={plan.problem.text} />
      <Field label="Актуальность" value={plan.problem.relevance} />
      <Field label="Масштаб" value={plan.problem.scale} />
      {plan.audience.length > 0 && (
        <div className="mt-3">
          <Table
            head={["Сегмент", "Характеристики", "Потребности", "Оценка"]}
            rows={plan.audience.map((a) => [a.segment, a.traits, a.needs, a.size])}
          />
        </div>
      )}
    </Card>

    <Card title="Цель проекта (SMART)">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        {[
          ["S", "Конкретная", plan.smart.s],
          ["M", "Измеримая", plan.smart.m],
          ["A", "Достижимая", plan.smart.a],
          ["R", "Значимая", plan.smart.r],
          ["T", "Во времени", plan.smart.t],
        ].map(([l, n, v]) => (
          <div key={l} className="rounded-lg bg-muted/40 border border-border p-2.5">
            <div className="font-display text-xl font-extrabold text-primary leading-none">{l}</div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">{n}</div>
            <p className="text-xs">{v || "—"}</p>
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold">{plan.goal}</p>
    </Card>

    <Card title="Задачи">
      <Table
        head={["№", "Задача", "Ответственный", "Недели", "Приоритет"]}
        rows={plan.tasks.map((t, i) => [i + 1, t.name, t.responsible, `${t.startWeek}–${t.endWeek}`, t.priority])}
      />
    </Card>

    <Card title="Диаграмма Ганта">
      <Gantt tasks={plan.tasks} />
    </Card>

    <Card title="Этапы и ключевые вехи">
      <Table
        head={["Этап", "Результат", "Сроки", "Ответственный"]}
        rows={plan.stages.map((s) => [s.name, s.result, s.period, s.responsible])}
      />
      {plan.milestones.length > 0 && (
        <div className="mt-4">
          <Table
            head={["Срок", "Веха", "Критерий достижения"]}
            rows={plan.milestones.map((m) => [m.when, m.name, m.criterion])}
          />
        </div>
      )}
    </Card>

    <Card title="Команда и заинтересованные стороны">
      <Table head={["Роль", "Зона ответственности", "Загрузка"]} rows={plan.team.map((t) => [t.role, t.duties, t.load])} />
      {plan.stakeholders.length > 0 && (
        <div className="mt-4">
          <Table
            head={["Сторона", "Тип", "Интерес и влияние", "Взаимодействие"]}
            rows={plan.stakeholders.map((s) => [s.name, s.type, s.interest, s.strategy])}
          />
        </div>
      )}
    </Card>

    <Card title="Жизненный цикл проекта">
      <Table
        head={["Фаза", "Действия", "Результаты", "Сроки"]}
        rows={plan.lifecycle.map((l) => [<b key="p">{l.phase}</b>, l.actions, l.results, l.period])}
      />
    </Card>

    <Card title="Условия и ограничения">
      <Table head={["Допущение", "Обоснование"]} rows={plan.assumptions.map((a) => [a.text, a.basis])} />
      {plan.constraints.length > 0 && (
        <div className="mt-4">
          <Table
            head={["Тип", "Ограничение", "Влияние", "Как смягчить"]}
            rows={plan.constraints.map((c) => [c.type, c.description, c.impact, c.mitigation])}
          />
        </div>
      )}
    </Card>

    <Card title="Матрица рисков">
      <RiskMatrix risks={plan.risks} />
      <div className="mt-4">
        <Table
          head={["ID", "Риск", "Категория", "В", "Вл", "Уровень", "Стратегия", "Меры"]}
          rows={plan.risks.map((r, i) => {
            const lv = riskLevel(r.probability, r.impact);
            return [
              `R${i + 1}`,
              r.risk,
              r.category,
              r.probability,
              r.impact,
              <span key="l" className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${lv.cls}`}>{lv.label}</span>,
              r.strategy,
              r.measures,
            ];
          })}
        />
      </div>
    </Card>

    <Card title="Контроль проекта">
      <Table head={["KPI", "Целевое значение", "Частота"]} rows={plan.kpi.map((k) => [k.name, k.target, k.frequency])} />
      {plan.reporting.length > 0 && (
        <div className="mt-4">
          <Table
            head={["Отчёт / совещание", "Периодичность", "Содержание"]}
            rows={plan.reporting.map((r) => [r.type, r.frequency, r.content])}
          />
        </div>
      )}
      <div className="mt-4">
        <Field label="Порядок внесения изменений" value={plan.changeProcedure} />
      </div>
    </Card>
  </div>
);

export default ProjectPreview;
