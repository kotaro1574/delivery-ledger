export type GoalTiming = "current" | "past" | "future";

export type GoalProgress = {
  goal: number;
  rate: number;
  remaining: number;
  overAmount: number;
  achieved: boolean;
  timing: GoalTiming;
  daysLeft: number | null;
  dailyPace: number | null;
};

export function goalTiming(month: string, today: Date): GoalTiming {
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  if (month === current) {
    return "current";
  }

  return month < current ? "past" : "future";
}

export function goalProgress({
  month,
  revenue,
  goal,
  today,
}: {
  month: string;
  revenue: number;
  goal: number | null;
  today: Date;
}): GoalProgress | null {
  if (!goal || goal <= 0) {
    return null;
  }

  const timing = goalTiming(month, today);
  const remaining = Math.max(0, goal - revenue);
  const achieved = revenue >= goal;
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft =
    timing === "current" ? daysInMonth - today.getDate() + 1 : null;

  return {
    goal,
    rate: Math.min(1, Math.max(0, revenue) / goal),
    remaining,
    overAmount: Math.max(0, revenue - goal),
    achieved,
    timing,
    daysLeft,
    dailyPace:
      daysLeft !== null && !achieved ? Math.ceil(remaining / daysLeft) : null,
  };
}
