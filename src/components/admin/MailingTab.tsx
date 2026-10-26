import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

const MAILING_URL = "https://functions.poehali.dev/0ecbd677-330a-4808-9ab2-dbbc21d157f7";

const MailingTab = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<number | null>(null);
  const [unsubscribed, setUnsubscribed] = useState(0);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0 });
  const [finished, setFinished] = useState(false);
  const headers = { "Content-Type": "application/json", "X-Authorization": token };

  useEffect(() => {
    fetch(MAILING_URL, { headers })
      .then((r) => r.json())
      .then((d) => {
        setRecipients(d.recipients ?? 0);
        setUnsubscribed(d.unsubscribed ?? 0);
      })
      .catch(() => setRecipients(0));
  }, [token]);

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch(MAILING_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ subject: subject.trim(), text: text.trim(), origin: window.location.origin, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка");
    return data;
  };

  const valid = () => {
    if (!subject.trim() || !text.trim()) {
      toast({ title: "Заполните тему и текст письма", variant: "destructive" });
      return false;
    }
    return true;
  };

  const sendTest = async () => {
    if (!valid()) return;
    setTesting(true);
    try {
      const d = await post({ action: "test" });
      toast({ title: `Тестовое письмо отправлено на ${d.to}` });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Ошибка", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const sendAll = async () => {
    if (!valid()) return;
    if (!window.confirm(`Отправить письмо ${recipients} получателям? Отменить рассылку после запуска нельзя.`)) return;
    setSending(true);
    setFinished(false);
    setProgress({ sent: 0, failed: 0 });
    let afterId = 0;
    let sent = 0;
    let failed = 0;
    try {
      for (;;) {
        const d = await post({ action: "send", after_id: afterId });
        sent += d.sent;
        failed += d.failed;
        afterId = d.last_id;
        setProgress({ sent, failed });
        if (d.done) break;
      }
      setFinished(true);
      toast({ title: `Рассылка завершена: отправлено ${sent}` });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Ошибка рассылки", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5 max-w-2xl space-y-4">
      <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
        <p>
          Получателей: <b>{recipients ?? "..."}</b> (зарегистрированные с подтверждённой почтой)
        </p>
        <p className="text-muted-foreground">Отписались от рассылки: {unsubscribed}. В каждое письмо автоматически добавляется ссылка для отписки.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Тема письма</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} disabled={sending} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Текст письма</label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} maxLength={10000} disabled={sending} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={sendTest} disabled={testing || sending} className="gap-2">
          <Icon name={testing ? "Loader2" : "Mail"} size={16} className={testing ? "animate-spin" : ""} />
          Отправить тест себе
        </Button>
        <Button onClick={sendAll} disabled={sending || !recipients} className="gap-2">
          <Icon name={sending ? "Loader2" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
          {sending ? "Отправляю..." : "Разослать всем"}
        </Button>
      </div>
      {(sending || finished) && (
        <p className="text-sm">
          Отправлено: <b>{progress.sent}</b>
          {progress.failed > 0 && <span className="text-destructive"> · не доставлено: {progress.failed}</span>}
          {finished && " · готово"}
        </p>
      )}
    </Card>
  );
};

export default MailingTab;
