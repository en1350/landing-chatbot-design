import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { adminGet } from "@/lib/adminApi";

interface NewsItem {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

const NewsSection = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminGet("news")
      .then((d) => setItems(d.news || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="container pb-4">
      <div className="rounded-2xl border border-primary/20 bg-card shadow-md overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 bg-primary px-5 py-3 text-primary-foreground">
          <Icon name="Newspaper" size={18} />
          <h2 className="font-display font-semibold">Новости сайта</h2>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {items.map((n) => (
            <article key={n.id} className="px-5 py-4">
              <div className="text-xs text-muted-foreground mb-1">
                {new Date(n.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h3 className="font-semibold mb-1">{n.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
            </article>
          ))}
          {loaded && items.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">Пока новостей нет. Скоро здесь появятся обновления сайта.</p>
          )}
          {!loaded && <p className="px-5 py-6 text-sm text-muted-foreground">Загрузка...</p>}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
