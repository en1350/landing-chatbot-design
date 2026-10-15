import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { adminGet, adminPost } from "@/lib/adminApi";

interface Item {
  id: number;
  name: string;
  kind: "review" | "wish";
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const STATUS: Record<Item["status"], { label: string; cls: string }> = {
  pending: { label: "На модерации", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Опубликовано", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Отклонено", cls: "bg-red-100 text-red-800" },
};

const FeedbackTab = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(() => {
    adminGet("feedback_all", token).then((d) => setItems(d.feedback)).catch(() => {});
  }, [token]);

  useEffect(load, [load]);

  const moderate = async (id: number, status: Item["status"]) => {
    await adminPost("feedback_moderate", { id, status }, token);
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
