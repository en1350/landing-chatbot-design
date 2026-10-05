import type { ScenarioBlock } from "./eventCardConfig";

export interface EventPreviewData {
  title: string;
  format: string;
  audience: string;
  duration: string;
  level: string;
  mode: string;
  date: string;
  location: string;
  minParticipants: string;
  maxParticipants: string;
  speaker: string;
  description: string;
  result: string;
  materials: string;
  contacts: string;
  price: string;
  scenario: ScenarioBlock[];
}

interface Props {
  data: EventPreviewData;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">{title}</div>
    {children}
  </div>
);

const EventCardPreview = ({ data }: Props) => {
  if (!data.title.trim()) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        🎯 Введите название, чтобы увидеть карточку события
      </div>
    );
  }

  const price = parseInt(data.price, 10) || 0;
  const dateText = data.date
    ? new Date(data.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "Дата уточняется";
  const materials = data.materials.split("\n").filter((m) => m.trim());
  const scenario = data.scenario.filter((s) => s.title.trim() || s.desc.trim());

  return (
    <div id="event-card-print" className="rounded-xl border-2 border-primary/60 bg-white overflow-hidden text-[#1e1b4b]">
      <div className="bg-primary text-primary-foreground p-5 md:p-6">
        <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-xs mb-2.5">
          {data.format} · {data.level}
        </span>
        <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{data.title}</h3>
        <p className="text-sm opacity-90">
          Для {data.audience.toLowerCase()} · {data.mode}
        </p>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-sm">
          <div className="rounded-lg bg-primary/10 px-3 py-2">
            <div className="text-[11px] uppercase text-muted-foreground">⏱ Длительность</div>
            <b>{data.duration}</b>
          </div>
          <div className="rounded-lg bg-primary/10 px-3 py-2">
            <div className="text-[11px] uppercase text-muted-foreground">📅 Дата</div>
            <b>{dateText}</b>
          </div>
          <div className="rounded-lg bg-primary/10 px-3 py-2">
            <div className="text-[11px] uppercase text-muted-foreground">👥 Группа</div>
            <b>
              {data.minParticipants}–{data.maxParticipants} чел.
            </b>
          </div>
          <div className="rounded-lg bg-primary/10 px-3 py-2">
            <div className="text-[11px] uppercase text-muted-foreground">🎓 Уровень</div>
            <b>{data.level}</b>
          </div>
        </div>

        {data.location.trim() && (
          <Section title="📍 Место / платформа">
            <p className="text-sm">{data.location}</p>
          </Section>
        )}

        {data.description.trim() && (
          <Section title="📌 О событии">
            <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
              {data.description}
            </p>
          </Section>
        )}

        {data.result.trim() && (
          <Section title="🎯 Результат для участника">
            <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
              {data.result}
            </p>
          </Section>
        )}

        {scenario.length > 0 && (
          <Section title="🎬 Сценарий">
            <div className="space-y-2">
              {scenario.map((s, i) => (
                <div key={s.id} className="rounded-lg bg-muted/60 border-l-4 border-primary px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-sm text-primary">
                      {i + 1}. {s.title.trim() || "Этап"}
                    </span>
                    {s.time.trim() && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                        {s.time}
                      </span>
                    )}
                  </div>
                  {s.desc.trim() && <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.desc}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.speaker.trim() && (
          <Section title="👤 Ведущий">
            <p className="text-sm">{data.speaker}</p>
          </Section>
        )}

        {materials.length > 0 && (
          <Section title="🧰 Что понадобится">
            <ul className="space-y-1">
              {materials.map((m, i) => (
                <li key={i} className="relative pl-5 text-sm leading-snug">
                  <span className="absolute left-0 font-bold text-emerald-600">✔</span>
                  {m}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.contacts.trim() && (
          <Section title="📞 Контакты">
            <p className="text-sm">{data.contacts}</p>
          </Section>
        )}
      </div>

      <div className="border-t border-border bg-muted/40 px-5 md:px-6 py-3.5 font-display text-xl font-bold text-primary">
        {price === 0 ? "Бесплатно" : `${price.toLocaleString("ru-RU")} ₽`}
      </div>
    </div>
  );
};

export default EventCardPreview;
