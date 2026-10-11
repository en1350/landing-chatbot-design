import { GameCardData } from "@/components/game-card/gameCardConfig";

interface Props {
  data: GameCardData;
}

const Title = ({ children }: { children: string }) => (
  <div className="font-bold border-l-4 border-primary pl-2.5 mb-2">{children}</div>
);

const GameCardPreview = ({ data }: Props) => {
  const hasContent =
    data.aiGoal || data.stages.length > 0 || data.rules || data.materials.length > 0 || data.tips.length > 0 || data.criteria;

  return (
    <div id="game-card-print" className="rounded-xl border-2 border-primary/60 bg-white p-6 md:p-8 text-[#1e1b4b]">
      <div className="text-center border-b-2 border-dashed border-border pb-4 mb-5">
        <h3 className="font-display text-xl md:text-2xl font-bold text-primary">{data.gameType}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {data.topic.trim() ? `📚 ${data.topic.trim()}` : "Тема урока не указана"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 mb-5 text-sm">
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Время:</span> {data.time}
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Участников:</span> {data.people}
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-semibold text-primary">Цель:</span> {data.goal}
        </div>
      </div>

      {!hasContent && (
        <p className="rounded-lg bg-muted/60 px-3.5 py-6 text-sm text-center italic text-muted-foreground">
          Сценарий пока пуст. Нажмите «Составить игру с помощью ИИ» — карточка заполнится автоматически.
        </p>
      )}

      {data.aiGoal && (
        <>
          <Title>🎯 Цель игры</Title>
          <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
            {data.aiGoal}
          </p>
        </>
      )}

      {data.stages.length > 0 && (
        <>
          <Title>📋 Ход игры</Title>
          <div className="space-y-2 mb-5">
            {data.stages.map((st, i) => (
              <div key={i} className="rounded-lg border-l-4 border-primary/60 bg-muted/60 px-3.5 py-2.5 text-sm">
                <div className="font-semibold text-primary mb-1">
                  {st.name}
                  {st.minutes > 0 ? ` (${st.minutes} мин)` : ""}
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{st.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {data.rules && (
        <>
          <Title>📜 Правила</Title>
          <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
            {data.rules}
          </p>
        </>
      )}

      {data.materials.length > 0 && (
        <>
          <Title>📦 Материалы</Title>
          <ul className="space-y-1.5 mb-5">
            {data.materials.map((m, i) => (
              <li key={i} className="relative pl-5 text-sm leading-snug">
                <span className="absolute left-0 font-bold text-emerald-600">✔</span>
                {m}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.tips.length > 0 && (
        <>
          <Title>💡 Советы ведущему</Title>
          <ul className="space-y-1.5 mb-5">
            {data.tips.map((t, i) => (
              <li key={i} className="relative pl-5 text-sm leading-snug">
                <span className="absolute left-0">•</span>
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.criteria && (
        <>
          <Title>🏁 Подведение итогов</Title>
          <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {data.criteria}
          </p>
        </>
      )}

      {data.scenario.trim() && (
        <div className="mt-5">
          <Title>📝 Дополнительные условия</Title>
          <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {data.scenario.trim()}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameCardPreview;
