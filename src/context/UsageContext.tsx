import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const SERVICES_KEY = "urokai_services_v1";
const SERVICES_BASE = 18420;

interface UsageContextValue {
  servicesCount: number;
  incrementServices: () => void;
}

const UsageContext = createContext<UsageContextValue | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [servicesCount, setServicesCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SERVICES_KEY);
      return raw ? Number(raw) : SERVICES_BASE;
    } catch {
      return SERVICES_BASE;
    }
  });

  useEffect(() => {
    localStorage.setItem(SERVICES_KEY, String(servicesCount));
  }, [servicesCount]);

  const incrementServices = () => setServicesCount((c) => c + 1);

  return (
    <UsageContext.Provider value={{ servicesCount, incrementServices }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error("useUsage must be used within UsageProvider");
  return ctx;
}
