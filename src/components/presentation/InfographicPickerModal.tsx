import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";
import { useAuth, AUTH_URL } from "@/context/AuthContext";

interface Item {
  id: number;
  title: string;
  image: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (title: string, url: string) => void;
}

const InfographicPickerModal = ({ open, onClose, onPick }: Props) => {
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    const post = async (payload: Record<string, unknown>) => {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      return data;
    };
    (async () => {
      setLoading(true);
      try {
        const list = await post({ action: "list_materials" });
        const infos = (list.items || list.materials || []).filter((m: { type: string }) => m.type === "infographic");
        const full = await Promise.all(
          infos.map(async (m: { id: number; title: string }) => {
            try {
              const d = await post({ action: "get_material", id: m.id });
              const image = JSON.parse(d.content || "{}").image as string | undefined;
              return image && image.startsWith("http") ? { id: m.id, title: m.title, image } : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) setItems(full.filter(Boolean) as Item[]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Вставить инфографику</DialogTitle>
          <DialogDescription>Выберите инфографику из личного кабинета, она встанет на слайд</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Пока нет сохранённой инфографики.
            <br />
            <Link to="/generator-infografiki" className="font-medium text-primary hover:underline">
              Создать инфографику
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => onPick(it.title, it.image)}
                className="group overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-primary"
              >
                <img src={it.image} alt={it.title} loading="lazy" className="aspect-square w-full object-cover" />
                <p className="truncate p-2 text-xs font-medium group-hover:text-primary">{it.title}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InfographicPickerModal;
