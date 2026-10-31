import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const SUBJECTS = [
  "Математика", "Русский язык", "Литературное чтение", "Окружающий мир", "Биология", "Физика",
  "Химия", "История", "Обществознание", "География", "Информатика", "Иностранный язык",
  "Технология", "ИЗО", "Музыка", "Физкультура", "ОБЖ",
];

interface Stage {
  name: string;
  minutes: number;
  description: string;
}

interface MiniPlan {
  title: string;
  goal: string;
  stages: Stage[];
  reflection: string;
  ovz: string[];
}

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const MiniPlanPanel = () => {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Урок");
  const [time, setTime] = useState("15 минут");
  const [goal, setGoal] = useState("");
  const [reflection, setReflection] = useState("");
  const [ovz, setOvz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<MiniPlan | null>(null);

  const generate = async () => {
    if (!subject.trim() || !topic.trim()) {
      setError("Укажите предмет и тему");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mini_plan", subject, topic, format, time, goal, reflection, ovz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить план");
      setPlan(data as MiniPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось составить план");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="space-y-3 mt-2">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Предмет</label>
        <Input
          list="mini-plan-subjects"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Начните вводить или выберите из списка"
        />
        <datalist id="mini-plan-subjects">
          {SUBJECTS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Тема</label>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Сложение дробей" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Формат</label>
          <select className={selectCls} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option>Урок</option>
            <option>Задание</option>
            <option>Игра</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Время</label>
          <select className={selectCls} value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="5 минут">5 мин</option>
            <option value="15 минут">15 мин</option>
            <option value="25 минут">25 мин</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Цель</label>
        <Textarea
          rows={2}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Чему должны научиться дети? Можно оставить пустым — ИИ предложит"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Рефлексия</label>
        <Textarea
          rows={2}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Как подведём итоги? Можно оставить пустым"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Button className="h-10 gap-2" onClick={generate} disabled={loading}>
          <Icon name={loading ? "Loader" : "Sparkles"} size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Составляю план..." : "Сгенерировать"}
        </Button>
        <Button
          type="button"
          variant={ovz ? "default" : "outline"}
          className="h-10 gap-2"
          onClick={() => setOvz((v) => !v)}
        >
          <Icon name={ovz ? "Check" : "Heart"} size={16} />
          {ovz ? "ОВЗ добавлено" : "ОВЗ"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>

    {plan && (
      <div className="mt-4 space-y-3 animate-fade-in">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            {format} · {subject} · {time}
          </p>
          <p className="font-display text-lg font-bold">{plan.title}</p>
          <p className="text-sm mt-2">
            <span className="font-semibold">Цель:</span> {plan.goal}
          </p>
        </div>
        <div className="space-y-2">
          {plan.stages?.map((s, i) => (
            <div key={i} className="rounded-xl border border-border p-3.5">
              <p className="text-sm font-semibold">
                {i + 1}. {s.name} <span className="text-muted-foreground font-normal">· {s.minutes} мин</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <p className="text-sm">
            <span className="font-semibold">Рефлексия:</span> {plan.reflection}
          </p>
        </div>
        {plan.ovz?.length > 0 && (
          <div className="rounded-xl border-l-4 border-coral bg-coral/10 p-4">
            <p className="font-semibold text-sm mb-2">Адаптация для обучающихся с ОВЗ</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {plan.ovz.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
    </>
  );
};

export default MiniPlanPanel;
