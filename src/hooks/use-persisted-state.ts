import { useEffect, useState, Dispatch, SetStateAction } from "react";

const PREFIX = "urokai_form_";

export function usePersistedState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = PREFIX + key;

  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      localStorage.removeItem(storageKey);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        return;
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value, storageKey, loaded]);

  return [value, setValue];
}
