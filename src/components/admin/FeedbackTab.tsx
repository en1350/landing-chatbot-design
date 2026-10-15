import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import { adminGet, adminPost } from "@/lib/adminApi";

interface Item {
  id: number;
  name: string;
  kind: "review" | "wish";
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_reply: string | null;
}

const STATUS: Record<Item["status"], { label: string; cls: string }> = {
  pending: { label: "На модерации", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Опубликовано", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Отклонено", cls: "bg-red-100 text-red-800" },
};

const FeedbackTab = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(() => {
    adminGet("feedback_all", token).then((d) => setItems(d.feedback)).catch(() => {});
  }, [token]);

  useEffect(load, [load]);

  const moderate = async (id: number, status: Item["status"]) => {
    await adminPost("feedback_moderate", { id, status }, token);
    load();
  };

  const startReply = (f: Item) => {
    setReplyId(f.id);
    setReplyText(f.admin_reply || "");
  };

  const saveReply = async (id: number) => {
    await adminPost("feedback_reply", { id, reply: replyText }, token);
    setReplyId(null);
    toast({ title: replyText.trim() ? "Ответ сохранён" : "Ответ удалён" });
    load();
  };

  const remove = async (id: number) => {
    await adminPost("feedback_delete", { id }, token);
    load();
  };

  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ждут проверки: <b className="text-foreground">{pending}</b>
      </p>
      {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Сообщений пока нет</Card>}
      {items.map((f) => (
        <Card key={f.id} className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{f.name}</span>
              <span className="text-xs text-muted-foreground">
                {f.kind === "review" ? "Отзыв" : "Пожелание"} · {new Date(f.created_at).toLocaleString("ru-RU")}
              </span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[f.status].cls}`}>
              {STATUS[f.status].label}
            </span>
          </div>
          <p className="text-sm whitespace-pre-line">{f.message}</p>
          {replyId === f.id ? (
            <div className="space-y-2">
              <Textarea
                rows={3}
                maxLength={1500}
                placeholder="Ответ администратора (пустой текст удалит ответ)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveReply(f.id)}>
                  Сохранить ответ
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplyId(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            f.admin_reply && (
              <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm whitespace-pre-line">
                <b className="block text-xs text-primary mb-1">Ваш ответ</b>
                {f.admin_reply}
              </div>
            )
          )}
          <div className="flex flex-wrap gap-2">
            {f.status !== "approved" && (
              <Button size="sm" className="gap-1.5" onClick={() => moderate(f.id, "approved")}>
                <Icon name="Check" size={14} />
                Опубликовать
              </Button>
            )}
            {f.status !== "rejected" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => moderate(f.id, "rejected")}>
                <Icon name="X" size={14} />
                Отклонить
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startReply(f)}>
              <Icon name="Reply" size={14} />
              {f.admin_reply ? "Изменить ответ" : "Ответить"}
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => remove(f.id)}>
              <Icon name="Trash2" size={14} />
              Удалить
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FeedbackTab;
