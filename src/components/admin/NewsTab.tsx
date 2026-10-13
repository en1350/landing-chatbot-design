import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { adminGet, adminPost } from "@/lib/adminApi";

interface NewsItem {
  id: number;
  title: string;
  body: string;
  is_published: boolean;
  created_at: string;
}

const NewsTab = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(() => {
    adminGet("news_all", token).then((d) => setItems(d.news)).catch(() => {});
  }, [token]);

  useEffect(load, [load]);

  const create = async () => {
    try {
      await adminPost("news_create", { title, body }, token);
      setTitle("");
      setBody("");
      toast({ title: "Новость опубликована" });
      load();
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    }
  };

  const toggle = async (n: NewsItem) => {
    await adminPost("news_update", { ...n, is_published: !n.is_published }, token);
    load();
  };

  const remove = async (id: number) => {
    await adminPost("news_delete", { id }, token);
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Новая новость</h3>
        <Input placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Текст новости" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button onClick={create} className="gap-2">
          <Icon name="Send" size={16} />
          Опубликовать
        </Button>
      </Card>

      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString("ru-RU")}
                  {!n.is_published && " · скрыта"}
                </div>
                <div className="font-semibold">{n.title}</div>
                <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{n.body}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => toggle(n)}>
                  {n.is_published ? "Скрыть" : "Показать"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(n.id)}>
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground">Новостей пока нет</p>}
      </div>
    </div>
  );
};

export default NewsTab;
