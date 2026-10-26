import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EXPERIENCE_URL = "https://functions.poehali.dev/46eba19d-23e4-44a2-89d2-4e0a4064268c";
const MAX_FILE_MB = 10;
const FILE_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

interface Post {
  id: number;
  user_id: number;
  author: string;
  kind: "work" | "report";
  title: string;
  description: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

const KIND_LABEL = { work: "Готовая работа", report: "Доклад" };

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExperienceModal = ({ open, onClose }: Props) => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [me, setMe] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<"work" | "report">("work");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const headers = { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(EXPERIENCE_URL, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить ленту");
      setPosts(data.posts);
      setMe(data.me);
      setIsAdmin(!!data.is_admin);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить ленту");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!FILE_EXTS.includes(ext)) {
      toast.error("Допустимы файлы PDF, Word, Excel и PowerPoint");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Файл должен быть не больше ${MAX_FILE_MB} МБ`);
      return;
    }
    setFile(f);
  };

  const publish = async () => {
    if (!title.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (!description.trim() && !file) {
      toast.error("Добавьте описание или прикрепите файл");
      return;
    }
    setSending(true);
    try {
      const payload: Record<string, unknown> = { kind, title: title.trim(), description: description.trim() };
      if (file) {
        payload.file = await fileToBase64(file);
        payload.file_name = file.name;
      }
      const res = await fetch(EXPERIENCE_URL, { method: "POST", headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось опубликовать");
      toast.success("Опубликовано в ленте опыта");
      setTitle("");
      setDescription("");
      setFile(null);
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось опубликовать");
    } finally {
      setSending(false);
    }
  };

  const hide = async (id: number) => {
    try {
      const res = await fetch(EXPERIENCE_URL, { method: "POST", headers, body: JSON.stringify({ action: "hide", id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось убрать публикацию");
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось убрать публикацию");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Трансляция опыта работы</DialogTitle>
          <DialogDescription>Делитесь готовыми работами и докладами с коллегами, смотрите материалы других педагогов</DialogDescription>
        </DialogHeader>

        {!formOpen ? (
          <Button onClick={() => setFormOpen(true)} className="w-full gap-2">
            <Icon name="Plus" size={16} />
            Разместить работу или доклад
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-2">
              {(["work", "report"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                  }`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Название" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={3000}
              rows={4}
              placeholder="Кратко опишите работу или тезисы доклада"
            />
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={pickFile} />
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <Icon name="FileText" size={16} className="shrink-0 text-primary" />
                <span className="flex-1 truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
              >
                <Icon name="Paperclip" size={16} />
                Прикрепить файл (PDF, Word, Excel, PowerPoint до {MAX_FILE_MB} МБ)
              </button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)} disabled={sending}>
                Отмена
              </Button>
              <Button className="flex-1 gap-2" onClick={publish} disabled={sending}>
                <Icon name={sending ? "Loader2" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
                {sending ? "Публикую..." : "Опубликовать"}
              </Button>
            </div>
          </div>
        )}

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Пока нет публикаций. Станьте первым, кто поделится опытом.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-coral">{KIND_LABEL[p.kind]}</span>
                    <h3 className="font-display text-base font-bold leading-snug">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.author} · {new Date(p.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  {(p.user_id === me || isAdmin) && (
                    <button
                      onClick={() => hide(p.id)}
                      title="Убрать публикацию"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  )}
                </div>
                {p.description && <p className="mt-2 whitespace-pre-wrap text-sm">{p.description}</p>}
                {p.file_url && (
                  <a
                    href={p.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Icon name="Download" size={15} />
                    <span className="max-w-[16rem] truncate">{p.file_name || "Скачать файл"}</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceModal;
