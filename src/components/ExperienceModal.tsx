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
  image_url: string | null;
  likes: number;
  comments: number;
  liked: boolean;
}

interface Comment {
  id: number;
  user_id: number;
  author: string;
  text: string;
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
  onNeedAuth?: () => void;
  onNeedUpgrade?: () => void;
}

const ExperienceModal = ({ open, onClose, onNeedAuth, onNeedUpgrade }: Props) => {
  const { token, user } = useAuth();
  const [paid, setPaid] = useState(false);
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
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
    setLoading(true);
    try {
      const res = await fetch(EXPERIENCE_URL, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить ленту");
      setPosts(data.posts);
      setMe(data.me);
      setIsAdmin(!!data.is_admin);
      setPaid(!!data.paid);
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

  const gate = (needPaid: boolean) => {
    if (!user) {
      onClose();
      onNeedAuth?.();
      return false;
    }
    if (needPaid && !paid) {
      onClose();
      onNeedUpgrade?.();
      return false;
    }
    return true;
  };

  const toggleLike = async (id: number) => {
    if (!gate(true)) return;
    try {
      const res = await fetch(EXPERIENCE_URL, { method: "POST", headers, body: JSON.stringify({ action: "like", id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось поставить лайк");
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, liked: data.liked, likes: data.likes } : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось поставить лайк");
    }
  };

  const toggleComments = async (id: number) => {
    if (openComments === id) {
      setOpenComments(null);
      return;
    }
    setOpenComments(id);
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);
    try {
      const res = await fetch(`${EXPERIENCE_URL}?post_id=${id}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить комментарии");
      setComments(data.comments);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить комментарии");
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async (id: number) => {
    if (!gate(true)) return;
    if (!commentText.trim()) return;
    setCommentSending(true);
    try {
      const res = await fetch(EXPERIENCE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "comment", id, text: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить комментарий");
      setComments((c) => [...c, { id: data.id, user_id: data.user_id, author: data.author, text: data.text, created_at: data.created_at }]);
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, comments: x.comments + 1 } : x)));
      setCommentText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить комментарий");
    } finally {
      setCommentSending(false);
    }
  };

  const hideComment = async (postId: number, id: number) => {
    try {
      const res = await fetch(EXPERIENCE_URL, { method: "POST", headers, body: JSON.stringify({ action: "hide_comment", id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось убрать комментарий");
      setComments((c) => c.filter((x) => x.id !== id));
      setPosts((p) => p.map((x) => (x.id === postId ? { ...x, comments: Math.max(0, x.comments - 1) } : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось убрать комментарий");
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
          <DialogDescription>
            Работы и доклады педагогов открыты для всех. Публиковать могут зарегистрированные, ставить лайки и комментировать — пользователи с платной подпиской
          </DialogDescription>
        </DialogHeader>

        {!formOpen ? (
          <Button onClick={() => (gate(false) ? setFormOpen(true) : undefined)} className="w-full gap-2">
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
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} loading="lazy" className="mt-3 w-full max-w-md rounded-lg border border-border" />
                )}
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
                <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-sm transition-colors hover:bg-accent ${p.liked ? "text-coral font-semibold" : "text-muted-foreground"}`}
                    title={paid ? "Нравится" : "Лайки доступны по платной подписке"}
                  >
                    <Icon name="Heart" size={16} className={p.liked ? "fill-current" : ""} />
                    {p.likes}
                  </button>
                  <button
                    onClick={() => toggleComments(p.id)}
                    className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <Icon name="MessageCircle" size={16} />
                    {p.comments}
                  </button>
                </div>
                {openComments === p.id && (
                  <div className="mt-2 space-y-2">
                    {commentsLoading ? (
                      <Icon name="Loader2" size={18} className="animate-spin text-muted-foreground" />
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold">
                              {c.author}{" "}
                              <span className="font-normal text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ru-RU")}</span>
                            </p>
                            <p className="whitespace-pre-wrap break-words">{c.text}</p>
                          </div>
                          {(c.user_id === me || isAdmin) && (
                            <button onClick={() => hideComment(p.id, c.id)} className="text-muted-foreground hover:text-destructive" title="Убрать">
                              <Icon name="X" size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                    {paid ? (
                      <div className="flex gap-2">
                        <Input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendComment(p.id)}
                          maxLength={1000}
                          placeholder="Ваш комментарий"
                        />
                        <Button onClick={() => sendComment(p.id)} disabled={commentSending || !commentText.trim()} size="icon" className="shrink-0">
                          <Icon name={commentSending ? "Loader2" : "Send"} size={16} className={commentSending ? "animate-spin" : ""} />
                        </Button>
                      </div>
                    ) : (
                      <button onClick={() => gate(true)} className="text-xs font-medium text-primary hover:underline">
                        {user ? "Комментировать можно по платной подписке" : "Войдите, чтобы комментировать"}
                      </button>
                    )}
                  </div>
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
