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

  useEffect(() => {
    adminGet("news")
      .then((d) => setItems(d.news || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container py-12">
      <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <Icon name="Newspaper" size={26} className="text-primary" />
        Новости сайта
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((n) => (
          <article key={n.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-xs text-muted-foreground mb-2">
              {new Date(n.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{n.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NewsSection;
