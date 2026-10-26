import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

const EXPERIENCE_URL = "https://functions.poehali.dev/46eba19d-23e4-44a2-89d2-4e0a4064268c";

interface Item {
  id: number;
  author: string;
  kind: "work" | "report";
  title: string;
  description: string;
  file_url: string | null;
  file_name: string | null;
  image_url: string | null;
  created_at: string;
}

const KIND_LABEL = { work: "Готовая работа", report: "Доклад" };

const ExperienceTab = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const headers = { "Content-Type": "application/json", "X-Authorization": token };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EXPERIENCE_URL}?moderation=1`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setItems(data.posts);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Ошибка", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(EXPERIENCE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, id, ...(action === "reject" ? { reason } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setItems((p) => p.filter((x) => x.id !== id));
      setRejectId(null);
      setReason("");
      toast({ title: action === "approve" ? "Опубликовано в ленте" : "Публикация отклонена" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Ошибка", variant: "destructive" });
    }
  };

  if (loading) return <Icon name="Loader2" size={22} className="animate-spin text-muted-foreground" />;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Нет публикаций, ожидающих проверки.</p>;

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <Card key={p.id} className="p-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral">{KIND_LABEL[p.kind]}</span>
          <h3 className="font-display text-base font-bold">{p.title}</h3>
          <p className="text-xs text-muted-foreground">
            {p.author} · {new Date(p.created_at).toLocaleString("ru-RU")}
          </p>
          {p.description && <p className="mt-2 whitespace-pre-wrap text-sm">{p.description}</p>}
          {p.image_url && <img src={p.image_url} alt={p.title} className="mt-3 w-full max-w-sm rounded-lg border border-border" />}
          {p.file_url && (
            <a
              href={p.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Icon name="Download" size={15} />
              {p.file_name || "Файл"}
            </a>
          )}
          {rejectId === p.id ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Причина отказа (автор её увидит)"
                className="min-w-0 flex-1"
              />
              <Button variant="destructive" onClick={() => act(p.id, "reject")}>
                Отклонить
              </Button>
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Отмена
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button onClick={() => act(p.id, "approve")} className="gap-1.5">
                <Icon name="Check" size={16} />
                Одобрить
              </Button>
              <Button variant="outline" onClick={() => setRejectId(p.id)} className="gap-1.5">
                <Icon name="X" size={16} />
                Отклонить
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ExperienceTab;
