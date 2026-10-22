import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/ae160342-bedb-4bc9-9b23-07195233be12";
const TOKEN_KEY = "urokai_token_v1";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export type SubscriptionPlan = "free" | "30days" | "90days" | "year";

export type GeneratorType = "lesson" | "game" | "intensive" | "task" | "antiplagiat" | "quiz";

export interface UsageState {
  lesson: number;
  game: number;
  intensive: number;
  task: number;
  antiplagiat: number;
  quiz: number;
}

const defaultUsage: UsageState = { lesson: 0, game: 0, intensive: 0, task: 0, antiplagiat: 0, quiz: 0 };

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  plan: SubscriptionPlan;
  expiresAt: string | null;
  loading: boolean;
  isPaid: boolean;
  trainersUnlocked: boolean;
  credits: number;
  canUsePaid: boolean;
  usage: UsageState;
  freeLimit: number;
  remainingUse: (type: GeneratorType) => number;
  canUseGenerator: (type: GeneratorType) => boolean;
  registerGeneratorUse: (type: GeneratorType) => Promise<boolean>;
  register: (email: string, password: string, name: string, privacyAccepted: boolean) => Promise<string>;
  verifyEmail: (verifyToken: string) => Promise<void>;
  resendVerification: (email: string) => Promise<string>;
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
    const err = new Error(data.error || "Что-то пошло не так") as Error & { code?: string };
    err.code = data.code;
    throw err;
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
  const [trainersUnlocked, setTrainersUnlocked] = useState(false);
  const [credits, setCredits] = useState(0);
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
      setTrainersUnlocked(false);
      setCredits(0);
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
      setTrainersUnlocked(!!data.trainers_unlocked);
      setCredits(data.credits || 0);
      setToken(currentToken);
    } catch {
      applySession(null);
      setUser(null);
      setPlan("free");
      setExpiresAt(null);
      setUsage(defaultUsage);
      setTrainersUnlocked(false);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    const pending = localStorage.getItem("urokai_pending_payment");
    if (!pending) return;
    apiRequest("check_payment", { payment_id: pending }, token)
      .then((data) => {
        if (data.paid) {
          localStorage.removeItem("urokai_pending_payment");
          const w = window as unknown as { _tmr?: unknown[] };
          w._tmr = w._tmr || [];
          w._tmr.push({ type: "reachGoal", id: "3784935", goal: "Конверсия" });
          refresh();
        }
      })
      .catch(() => {});
  }, [token, refresh]);

  useEffect(() => {
    if (credits <= 0 || plan !== "free") return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 6000);
    return () => clearInterval(timer);
  }, [credits, plan, refresh]);


  const register = async (email: string, password: string, name: string, privacyAccepted: boolean) => {
    const data = await apiRequest("register", {
      email,
      password,
      name,
      privacy_accepted: privacyAccepted,
      origin: window.location.origin,
      visitor_id: (() => {
        try {
          return localStorage.getItem("urokai_visitor_id") || "";
        } catch {
          return "";
        }
      })(),
    });
    return (data.message as string) || "Мы отправили письмо со ссылкой для подтверждения email";
  };

  const verifyEmail = async (verifyToken: string) => {
    const data = await apiRequest("verify_email", { token: verifyToken });
    applySession(data.token);
    setUser(data.user);
    setPlan(data.plan || "free");
    setUsage(data.usage || defaultUsage);
    setFreeLimit(data.free_limit ?? 3);
    setTrainersUnlocked(!!data.trainers_unlocked);
      setCredits(data.credits || 0);
  };

  const resendVerification = async (email: string) => {
    const data = await apiRequest("resend_verification", { email, origin: window.location.origin });
    return data.message as string;
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest("login", { email, password });
    applySession(data.token);
    setUser(data.user);
    setPlan(data.plan || "free");
    setUsage(data.usage || defaultUsage);
    setFreeLimit(data.free_limit ?? 3);
    setTrainersUnlocked(!!data.trainers_unlocked);
      setCredits(data.credits || 0);
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
      setTrainersUnlocked(false);
      setCredits(0);
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
    setTrainersUnlocked(false);
      setCredits(0);
  };

  const isPaid = plan !== "free";
  const canUsePaid = isPaid || credits > 0;

  const totalUsage = (u: UsageState) => u.lesson + u.game + u.intensive + u.task + u.antiplagiat + u.quiz;

  // Единый лимит бесплатных генераций на все инструменты вместе (не по каждому отдельно)
  const remainingUse = (_type: GeneratorType) => Math.max(0, freeLimit - totalUsage(usage));
  const canUseGenerator = (_type: GeneratorType) => !!user && (isPaid || credits > 0 || remainingUse(_type) > 0);

  const registerGeneratorUse = async (type: GeneratorType): Promise<boolean> => {
    if (!token) return false;
    try {
      const data = await apiRequest("register_use", { type }, token);
      setUsage(data.usage || defaultUsage);
      setFreeLimit(data.free_limit ?? 3);
      if (typeof data.credits === "number") setCredits(data.credits);
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
        trainersUnlocked,
        credits,
        canUsePaid,
        usage,
        freeLimit,
        remainingUse,
        canUseGenerator,
        registerGeneratorUse,
        register,
        verifyEmail,
        resendVerification,
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