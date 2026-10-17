import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const CHAT_URL = "https://functions.poehali.dev/f0278fe2-9ca4-49d4-8a58-cd5614b999be";
const POLL_MS = 2500;

interface ChatMessage {
  id: number;
  user_id: number;
  author: string;
  text: string;
  created_at: string;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const MemberChat = () => {
  const { user, token, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
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
      if (incoming.length) {
        lastIdRef.current = incoming[incoming.length - 1].id;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          return [...prev, ...incoming.filter((m) => !known.has(m.id))];
        });
      }
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
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !token || sending) return;
    setSending(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось отправить");
      setInput("");
      stickRef.current = true;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить сообщение");
    } finally {
      setSending(false);
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
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"
                    }`}
                  >
                    {!mine && <p className="text-xs font-bold mb-0.5 opacity-80">{m.author}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className="text-[10px] mt-1 opacity-70 text-right">{formatTime(m.created_at)}</p>
                  </div>
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

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Icon name="ArrowUp" size={16} />
            </button>
          </form>
        </div>
      </main>

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
