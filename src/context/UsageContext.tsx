import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const SERVICES_KEY = "urokai_services_v1";
const SERVICES_BASE = 18420;

interface UsageContextValue {
  servicesCount: number;
  incrementServices: () => void;
}

const UsageContext = createContext<UsageContextValue | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [servicesCount, setServicesCount] = useState<number>(SERVICES_BASE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SERVICES_KEY);
      if (raw) setServicesCount(Number(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(SERVICES_KEY, String(servicesCount));
  }, [servicesCount, loaded]);

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