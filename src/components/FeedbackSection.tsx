import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { adminGet, adminPost } from "@/lib/adminApi";

interface FeedbackItem {
  id: number;
  name: string;
  kind: "review" | "wish";
  message: string;
  created_at: string;
  admin_reply: string | null;
}

const VISITOR_KEY = "urokai_visitor_id";

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const FeedbackSection = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"review" | "wish">("review");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(() => {
    adminGet("feedback_public").then((d) => setItems(d.feedback)).catch(() => {});
  }, []);

  useEffect(load, [load]);

  const submit = async () => {
    setSending(true);
    try {
      await adminPost("feedback_submit", { name, message, kind, visitor_id: getVisitorId() });
      setSent(true);
      setName("");
      setMessage("");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="feedback" className="container py-12 md:py-16 scroll-mt-20">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold">Отзывы и пожелания</h2>
        <p className="mt-2 text-muted-foreground">
          Расскажите, что понравилось или чего не хватает. Сообщения публикуются после проверки модератором в течение нескольких часов.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Icon name="CheckCircle2" size={30} />
              </span>
              <h3 className="font-display text-lg font-bold">Спасибо! Сообщение отправлено</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Оно появится на сайте после модерации, обычно в течение нескольких часов.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Написать ещё
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["review", "Отзыв", "Star"],
                  ["wish", "Пожелание", "Lightbulb"],
                ] as const).map(([k, label, icon]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      kind === k
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <Icon name={icon} size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <Input placeholder="Ваше имя" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea
                rows={5}
                maxLength={1500}
                placeholder={kind === "review" ? "Что вам понравилось в сервисе?" : "Какой инструмент или функцию добавить?"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={submit} disabled={sending} className="w-full gap-2 h-11">
                <Icon name="Send" size={16} />
                {sending ? "Отправляем..." : "Отправить на модерацию"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Email не нужен. Публикуется только имя и текст сообщения.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Пока нет опубликованных сообщений. Станьте первым!
            </div>
          ) : (
            items.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{f.name}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Icon name={f.kind === "review" ? "Star" : "Lightbulb"} size={11} />
                    {f.kind === "review" ? "Отзыв" : "Пожелание"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{f.message}</p>
                {f.admin_reply && (
                  <div className="mt-3 rounded-xl border-l-4 border-primary bg-primary/5 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Icon name="BadgeCheck" size={14} />
                      Ответ администратора
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{f.admin_reply}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
