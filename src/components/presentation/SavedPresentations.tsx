import { useState } from "react";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { SavedPresentationMeta } from "@/components/presentation/savedPresentations";

interface Props {
  items: SavedPresentationMeta[];
  loading: boolean;
  openingId: number | null;
  activeId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => Promise<boolean>;
}

const SavedPresentations = ({ items, loading, openingId, activeId, onOpen, onDelete, onRename }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (id: number, title: string) => {
    setEditingId(id);
    setDraft(title);
  };

  const commit = async (id: number, current: string) => {
    const title = draft.trim();
    if (!title || title === current) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    const ok = await onRename(id, title);
    setSaving(false);
    if (ok) setEditingId(null);
  };

  return (
  <div className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
    <h2 className="font-display text-lg font-bold mb-1">📁 Мои презентации</h2>
    <p className="text-xs text-muted-foreground mb-4">Созданные презентации сохраняются автоматически.</p>

    {loading ? (
      <div className="flex justify-center py-6">
        <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
      </div>
    ) : items.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-6">Пока нет сохранённых презентаций.</p>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-2 rounded-lg border p-3 ${
              activeId === m.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {editingId === m.id ? (
              <>
                <Input
                  autoFocus
                  value={draft}
                  maxLength={120}
                  disabled={saving}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(m.id, m.title);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-8 flex-1 min-w-0 text-sm"
                  aria-label="Название презентации"
                />
                <button
                  onClick={() => commit(m.id, m.title)}
                  disabled={saving || !draft.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-primary transition-colors shrink-0 disabled:opacity-50"
                  title="Сохранить название"
                  aria-label="Сохранить название"
                >
                  {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Check" size={15} />}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
                  title="Отмена"
                  aria-label="Отмена"
                >
                  <Icon name="X" size={15} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={m.title}>{m.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 shrink-0" onClick={() => onOpen(m.id)} disabled={openingId === m.id}>
                  {openingId === m.id ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="FolderOpen" size={14} />}
                  Открыть
                </Button>
                <button
                  onClick={() => startEdit(m.id, m.title)}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
                  title="Переименовать"
                  aria-label="Переименовать презентацию"
                >
                  <Icon name="Pencil" size={15} />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(m.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors shrink-0"
              title="Удалить"
              aria-label="Удалить презентацию"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

export default SavedPresentations;
