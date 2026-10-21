const COUNTER_IDS = [113679744, 101026698];

type YmFn = (id: number, action: string, goal: string, params?: Record<string, unknown>) => void;

export const reachGoal = (goal: string, params?: Record<string, unknown>) => {
  const ym = (window as unknown as { ym?: YmFn }).ym;
  if (typeof ym !== "function") return;
  COUNTER_IDS.forEach((id) => {
    try {
      ym(id, "reachGoal", goal, params);
    } catch {
      return;
    }
  });
};
