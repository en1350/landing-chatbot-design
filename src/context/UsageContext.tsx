import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type GeneratorType = "lesson" | "game" | "intensive" | "task";

const FREE_LIMIT = 3;
const STORAGE_KEY = "urokai_usage_v1";
const SERVICES_KEY = "urokai_services_v1";
const SERVICES_BASE = 18420;

interface UsageState {
  lesson: number;
  game: number;
  intensive: number;
  task: number;
}

interface UsageContextValue {
  usage: UsageState;
  servicesCount: number;
  freeLimit: number;
  remaining: (type: GeneratorType) => number;
  canUse: (type: GeneratorType) => boolean;
  registerUse: (type: GeneratorType) => void;
  isPaid: boolean;
  setPaid: (v: boolean) => void;
}

const defaultUsage: UsageState = { lesson: 0, game: 0, intensive: 0, task: 0 };

const UsageContext = createContext<UsageContextValue | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<UsageState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultUsage, ...JSON.parse(raw) } : defaultUsage;
    } catch {
      return defaultUsage;
    }
  });

  const [servicesCount, setServicesCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SERVICES_KEY);
      return raw ? Number(raw) : SERVICES_BASE;
    } catch {
      return SERVICES_BASE;
    }
  });

  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    localStorage.setItem(SERVICES_KEY, String(servicesCount));
  }, [servicesCount]);

  const remaining = (type: GeneratorType) => Math.max(0, FREE_LIMIT - usage[type]);
  const canUse = (type: GeneratorType) => isPaid || remaining(type) > 0;

  const registerUse = (type: GeneratorType) => {
    setUsage((u) => ({ ...u, [type]: u[type] + 1 }));
    setServicesCount((c) => c + 1);
  };

  return (
    <UsageContext.Provider
      value={{ usage, servicesCount, freeLimit: FREE_LIMIT, remaining, canUse, registerUse, isPaid, setPaid: setIsPaid }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error("useUsage must be used within UsageProvider");
  return ctx;
}
