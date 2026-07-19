import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/ae160342-bedb-4bc9-9b23-07195233be12";
const TOKEN_KEY = "urokai_token_v1";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export type SubscriptionPlan = "free" | "30days" | "7days" | "year";

export type GeneratorType = "lesson" | "game" | "intensive" | "task" | "antiplagiat";

export interface UsageState {
  lesson: number;
  game: number;
  intensive: number;
  task: number;
  antiplagiat: number;
}

const defaultUsage: UsageState = { lesson: 0, game: 0, intensive: 0, task: 0, antiplagiat: 0 };

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  plan: SubscriptionPlan;
  expiresAt: string | null;
  loading: boolean;
  isPaid: boolean;
  usage: UsageState;
  freeLimit: number;
  remainingUse: (type: GeneratorType) => number;
  canUseGenerator: (type: GeneratorType) => boolean;
  registerGeneratorUse: (type: GeneratorType) => Promise<boolean>;
  register: (email: string, password: string, name: string, privacyAccepted: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiRequest(action: string, payload: Record<string, unknown> = {}, token?: string | null) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Authorization": token } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Что-то пошло не так");
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageState>(defaultUsage);
  const [freeLimit, setFreeLimit] = useState(3);

  const applySession = (t: string | null) => {
    setToken(t);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  };

  const refresh = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setPlan("free");
      setExpiresAt(null);
      setUsage(defaultUsage);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(AUTH_URL, {
        method: "GET",
        headers: { "X-Authorization": currentToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setPlan(data.plan || "free");
      setExpiresAt(data.expires_at || null);
      setUsage(data.usage || defaultUsage);
      setFreeLimit(data.free_limit ?? 3);
      setToken(currentToken);
    } catch {
      applySession(null);
      setUser(null);
      setPlan("free");
      setExpiresAt(null);
      setUsage(defaultUsage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = async (email: string, password: string, name: string, privacyAccepted: boolean) => {
    const data = await apiRequest("register", { email, password, name, privacy_accepted: privacyAccepted });
    applySession(data.token);
    setUser(data.user);
    setPlan(data.plan || "free");
    setUsage(data.usage || defaultUsage);
    setFreeLimit(data.free_limit ?? 3);
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest("login", { email, password });
    applySession(data.token);
    setUser(data.user);
    setPlan(data.plan || "free");
    setUsage(data.usage || defaultUsage);
    setFreeLimit(data.free_limit ?? 3);
  };

  const logout = async () => {
    try {
      await apiRequest("logout", {}, token);
    } finally {
      applySession(null);
      setUser(null);
      setPlan("free");
      setExpiresAt(null);
      setUsage(defaultUsage);
    }
  };

  const forgotPassword = async (email: string) => {
    const data = await apiRequest("forgot_password", { email, origin: window.location.origin });
    return data.message as string;
  };

  const resetPassword = async (resetToken: string, newPassword: string) => {
    const data = await apiRequest("reset_password", { token: resetToken, new_password: newPassword });
    applySession(data.token);
    setUser(data.user);
    setPlan("free");
  };

  const isPaid = plan !== "free";

  const remainingUse = (type: GeneratorType) => Math.max(0, freeLimit - usage[type]);
  const canUseGenerator = (type: GeneratorType) => !!user && (isPaid || remainingUse(type) > 0);

  const registerGeneratorUse = async (type: GeneratorType): Promise<boolean> => {
    if (!token) return false;
    try {
      const data = await apiRequest("register_use", { type }, token);
      setUsage(data.usage || defaultUsage);
      setFreeLimit(data.free_limit ?? 3);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        plan,
        expiresAt,
        loading,
        isPaid,
        usage,
        freeLimit,
        remainingUse,
        canUseGenerator,
        registerGeneratorUse,
        register,
        login,
        logout,
        refresh,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AUTH_URL };