import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export const CHAT_URL = "https://functions.poehali.dev/f0278fe2-9ca4-49d4-8a58-cd5614b999be";
const POLL_MS = 10000;
const READ_EVENT = "urokai-chat-read";

const readKey = (userId: number) => `urokai_chat_read_${userId}`;

export const markChatRead = (userId: number, messageId: number) => {
  const current = Number(localStorage.getItem(readKey(userId)) || 0);
  if (messageId > current) localStorage.setItem(readKey(userId), String(messageId));
  window.dispatchEvent(new Event(READ_EVENT));
};

export const useChatUnread = () => {
  const { user, token } = useAuth();
  const [unread, setUnread] = useState(0);

  const check = useCallback(async () => {
    if (!user || !token) return;
    const stored = localStorage.getItem(readKey(user.id));
    try {
      const res = await fetch(`${CHAT_URL}?unread_after=${stored ?? 0}`, {
        headers: { "X-Authorization": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (stored === null) {
        localStorage.setItem(readKey(user.id), String(data.latest_id));
        setUnread(0);
        return;
      }
      setUnread(data.unread as number);
    } catch {
      return;
    }
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) {
      setUnread(0);
      return;
    }
    check();
    const timer = setInterval(() => {
      if (!document.hidden) check();
    }, POLL_MS);
    window.addEventListener(READ_EVENT, check);
    return () => {
      clearInterval(timer);
      window.removeEventListener(READ_EVENT, check);
    };
  }, [user, token, check]);

  return unread;
};
