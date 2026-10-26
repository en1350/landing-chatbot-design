import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { DEMO_STEPS } from "./demoSteps";

const AUTO_MS = 6000;

const SiteDemo = () => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = DEMO_STEPS[index];
  const last = index === DEMO_STEPS.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (last) setPlaying(false);
      else setIndex((i) => i + 1);
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [playing, index, last]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden w-full max-w-md">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-coral text-coral-foreground">
        <span className="flex items-center gap-2 font-display text-sm font-bold">
          <Icon name="PlayCircle" size={17} />
          Как работать с сайтом
        </span>
        <button
          type="button"
          onClick={() => {
            if (!playing && last) setIndex(0);
            setPlaying((p) => !p);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
        >
          <Icon name={playing ? "Pause" : "Play"} size={12} />
          {playing ? "Пауза" : "Показать"}
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-3" role="tablist" aria-label="Шаги демонстрации">
        {DEMO_STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Шаг ${i + 1}: ${s.title}`}
            onClick={() => {
              setIndex(i);
              setPlaying(false);
            }}
            className="group flex-1 py-1.5"
          >
            <span
              className={`block h-1.5 rounded-full transition-colors ${
                i < index ? "bg-primary" : i === index ? "bg-coral" : "bg-muted group-hover:bg-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>

      <div key={index} className="px-4 py-4 h-[22rem] overflow-y-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name={step.icon} size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Шаг {index + 1} из {DEMO_STEPS.length}
            </p>
            <h3 className="font-display text-base font-bold leading-tight">{step.title}</h3>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>

        <ol className="mt-3 space-y-2">
          {step.actions.map((a, i) => (
            <li key={a} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2.5 text-sm text-secondary-foreground">
          <Icon name="CheckCircle2" size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>{step.result}</span>
        </div>

        {step.to && (
          <Link
            to={step.to}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {step.toLabel}
            <Icon name="ArrowRight" size={14} />
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border p-2.5">
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setPlaying(false);
          }}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-sm hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit"
        >
          <Icon name="ArrowLeft" size={14} />
          Назад
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setIndex(last ? 0 : index + 1);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {last ? "Сначала" : "Далее"}
          <Icon name={last ? "RotateCcw" : "ArrowRight"} size={14} />
        </button>
      </div>
    </div>
  );
};

export default SiteDemo;
