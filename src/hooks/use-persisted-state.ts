import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";

const PREFIX = "urokai_form_";

export function usePersistedState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      localStorage.removeItem(storageKey);
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        return;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value, storageKey]);

  return [value, setValue];
}
