import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import { markChatRead } from "@/hooks/use-chat-unread";

const CHAT_URL = "https://functions.poehali.dev/f0278fe2-9ca4-49d4-8a58-cd5614b999be";
const POLL_MS = 2500;

interface ChatMessage {
  id: number;
  user_id: number;
  author: string;
  text: string;
  created_at: string;
  image_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
}

const MAX_FILE_MB = 10;
const DOC_EXTS = ["pdf", "doc", "docx", "xls", "xlsx"];

const docMeta = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return { icon: "FileText", color: "text-red-600" };
  if (ext.startsWith("xls")) return { icon: "FileSpreadsheet", color: "text-emerald-600" };
  return { icon: "FileText", color: "text-blue-600" };
};

const MAX_IMAGE_MB = 4;

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

const EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","🙂","😉","😊","😇",
  "🥰","😍","🤩","😘","😋","😎","🤓","🤔","🤗","🤭","😏","😌",
  "😴","😢","😭","😡","😱","🙄","😬","🤝","👍","👎","👏","🙌",
  "🙏","💪","👋","✌️","👌","🤞","❤️","💔","🔥","⭐","🎉","🎓",
  "📚","✏️","📝","💡","✅","❌","❓","❗","☕","🌷","☀️","🍀",
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const MemberChat = () => {
  const { user, token, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_URL}?since_id=${lastIdRef.current}`, {
        headers: { "X-Authorization": token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить чат");
      const incoming = data.messages as ChatMessage[];
      const recent = new Set<number>(data.recent_ids as number[]);
      const minRecent = recent.size ? Math.min(...recent) : 0;
      setIsAdmin(!!data.is_admin);
      if (incoming.length) lastIdRef.current = incoming[incoming.length - 1].id;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...incoming.filter((m) => !known.has(m.id))];
        return merged.filter((m) => m.id < minRecent || recent.has(m.id));
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Нет связи с чатом");
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;
    lastIdRef.current = 0;
    setMessages([]);
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [user, token, load]);

  useEffect(() => {
    if (!user || !messages.length) return;
    markChatRead(user.id, messages[messages.length - 1].id);
  }, [messages, user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const addEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    const next = input.slice(0, start) + emoji + input.slice(end);
    if (next.length > 1000) return;
    setInput(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Допустимы только JPG, PNG, WEBP или GIF");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Картинка должна быть не больше ${MAX_IMAGE_MB} МБ`);
      return;
    }
    setError(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const pickDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!DOC_EXTS.includes(ext)) {
      setError("Допустимы только файлы PDF, Word и Excel");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Файл должен быть не больше ${MAX_FILE_MB} МБ`);
      return;
    }
    setError(null);
    setDoc(file);
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !image && !doc) || !token || sending) return;
    setSending(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify(
          {
            message: text,
            ...(image ? { image: await fileToBase64(image), image_type: image.type } : {}),
            ...(doc ? { file: await fileToBase64(doc), file_name: doc.name } : {}),
          }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить");
      setInput("");
      clearImage();
      setDoc(null);
      stickRef.current = true;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Удалить это сообщение?")) return;
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось удалить");
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить сообщение");
    }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => (window.location.href = "/")}
        onOpenRandomizer={() => (window.location.href = "/")}
        onOpenAntiplagiat={() => (window.location.href = "/")}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenPricing={() => setProfileOpen(true)}
      />

      <main className="flex-1 container py-6 sm:py-10 max-w-3xl">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-coral">Только для своих</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">Чат педагогов</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Закрытый чат для зарегистрированных пользователей УрокАИ. Сообщения появляются сразу у всех участников.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="font-display text-sm font-bold">Общий чат онлайн</span>
          </div>

          <div ref={scrollRef} onScroll={onScroll} className="h-[55vh] min-h-[320px] overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !error && (
              <p className="text-sm text-muted-foreground text-center py-10">Пока нет сообщений. Напишите первым!</p>
            )}
            {messages.map((m) => {
              const mine = m.user_id === user.id;
              return (
                <div key={m.id} className={`group flex items-center gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                  {mine && (
                    <button
                      onClick={() => remove(m.id)}
                      title="Удалить сообщение"
                      className="opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-destructive transition-opacity"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"
                    }`}
                  >
                    {!mine && <p className="text-xs font-bold mb-0.5 opacity-80">{m.author}</p>}
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="Картинка в чате"
                        loading="lazy"
                        onClick={() => setZoom(m.image_url!)}
                        className="mb-1 max-h-64 w-full cursor-zoom-in rounded-lg object-cover"
                      />
                    )}
                    {m.file_url && m.file_name && (
                      <div className="mb-1 flex items-center gap-2.5 rounded-lg bg-background/90 p-2.5 text-foreground">
                        <span className={`shrink-0 ${docMeta(m.file_name).color}`}>
                          <Icon name={docMeta(m.file_name).icon} size={28} />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-xs font-semibold leading-snug">{m.file_name}</span>
                        <a
                          href={m.file_url}
                          download={m.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          <Icon name="Download" size={13} />
                          Скачать
                        </a>
                      </div>
                    )}
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    <p className="text-[10px] mt-1 opacity-70 text-right">{formatTime(m.created_at)}</p>
                  </div>
                  {!mine && isAdmin && (
                    <button
                      onClick={() => remove(m.id)}
                      title="Удалить сообщение"
                      className="opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-destructive transition-opacity"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="px-4 pb-2 text-xs text-destructive flex items-center gap-1.5">
              <Icon name="AlertCircle" size={13} />
              {error}
            </p>
          )}

          {emojiOpen && (
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 border-t border-border bg-secondary/40 p-2.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="flex h-9 items-center justify-center rounded-lg text-xl hover:bg-accent transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {preview && (
            <div className="flex items-center gap-3 border-t border-border bg-secondary/40 px-3 py-2">
              <img src={preview} alt="Предпросмотр" className="h-14 w-14 rounded-lg object-cover" />
              <span className="flex-1 truncate text-xs text-muted-foreground">{image?.name}</span>
              <button type="button" onClick={clearImage} title="Убрать картинку" className="text-muted-foreground hover:text-destructive">
                <Icon name="X" size={16} />
              </button>
            </div>
          )}

          {doc && (
            <div className="flex items-center gap-3 border-t border-border bg-secondary/40 px-3 py-2">
              <span className={docMeta(doc.name).color}>
                <Icon name={docMeta(doc.name).icon} size={28} />
              </span>
              <span className="flex-1 truncate text-xs text-muted-foreground">
                {doc.name} · {(doc.size / 1024 / 1024).toFixed(1)} МБ
              </span>
              <button type="button" onClick={() => setDoc(null)} title="Убрать файл" className="text-muted-foreground hover:text-destructive">
                <Icon name="X" size={16} />
              </button>
            </div>
          )}

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-2.5">
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={pickDoc} className="hidden" />
            <button
              type="button"
              onClick={() => docRef.current?.click()}
              title="Прикрепить документ (PDF, Word, Excel)"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                doc ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon name="Paperclip" size={20} />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Прикрепить картинку"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                image ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon name="Image" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setEmojiOpen((v) => !v)}
              title="Смайлики"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                emojiOpen ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon name="Smile" size={20} />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !image && !doc) || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Icon name="ArrowUp" size={16} />
            </button>
          </form>
        </div>
      </main>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Картинка" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => (window.location.href = "/")}
        onOpenAntiplagiat={() => (window.location.href = "/")}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default MemberChat;
