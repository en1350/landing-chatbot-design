import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  role: "bot" | "user";
  text: string;
}

const INTRO: Message = {
  role: "bot",
  text: "Привет! Я ИИ-помощник УрокАИ 👋 Спросите меня, как составить план урока, придумать игру или оценить работу учеников — подскажу или запущу нужный генератор.",
};

const SUGGESTIONS = [
  "Как быстро составить план урока?",
  "Придумай игру для 5 класса",
  "Как оценивать самостоятельные работы?",
];

function mockReply(text: string): string {
  const q = text.toLowerCase();
  if (q.includes("план") || q.includes("урок")) {
    return "Открой «Генератор уроков» ниже — укажи тему и класс, и я соберу план с целями, этапами и домашним заданием за 30 секунд ✏️";
  }
  if (q.includes("игр")) {
    return "«Генератор игр» подберёт механику под тему и возраст: викторины, квесты, командные соревнования 🎲";
  }
  if (q.includes("интенсив") || q.includes("мастер")) {
    return "Для больших форматов используй «Генератор интенсивов» — расписание по дням, блоки и материалы для мастер-классов 📅";
  }
  if (q.includes("задан") || q.includes("оцен") || q.includes("тетрад")) {
    return "Для заданий — «Генератор заданий», а фото тетрадей можно загрузить в разделе «Проверка тетради»: ИИ найдёт ошибки и предложит оценку 📸";
  }
  return "Хороший вопрос! Опишите тему подробнее или воспользуйтесь одним из генераторов ниже — я подстроюсь под класс, предмет и цель урока.";
}

const ChatWidget = () => {
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: mockReply(trimmed) }]);
      setTyping(false);
    }, 850 + Math.random() * 500);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden w-full max-w-md">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <span className="font-display text-sm font-bold">ИИ-помощник онлайн</span>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-coral text-coral-foreground rounded-br-sm"
                  : "bg-secondary text-secondary-foreground rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "200ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        )}
      </div>

      {messages.length < 3 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите вопрос..."
          className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
          disabled={!input.trim()}
        >
          <Icon name="ArrowUp" size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;