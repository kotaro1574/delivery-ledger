export type SlimeTier = 0 | 1 | 2 | 3 | 4;

export type MonthlyLevel = {
  level: number;
  tier: SlimeTier;
  title: string;
  step: number;
  gems: number;
  currentLevelStart: number;
  nextLevelAt: number;
  remaining: number;
  progress: number;
};

export const LEVELS_TO_GOAL = 40;
export const KING_LEVEL = LEVELS_TO_GOAL + 1;

export const tierTitles = [
  "ルーキー",
  "レギュラー",
  "エース",
  "ベテラン",
  "キング",
] as const;

function revenueForLevel(level: number, goal: number) {
  return Math.ceil(((level - 1) * goal) / LEVELS_TO_GOAL);
}

export function monthlyLevel(
  revenue: number,
  goal: number | null,
): MonthlyLevel | null {
  if (!goal || goal <= 0) {
    return null;
  }

  const earned = Math.max(0, revenue);
  const level = Math.floor((earned * LEVELS_TO_GOAL) / goal) + 1;
  const tier = Math.min(4, Math.floor((level - 1) / 10)) as SlimeTier;
  const currentLevelStart = revenueForLevel(level, goal);
  const nextLevelAt = revenueForLevel(level + 1, goal);

  return {
    level,
    tier,
    title: tierTitles[tier],
    step: tier < 4 ? (level - 1) % 10 : 9,
    gems: tier === 4 ? Math.min(3, Math.floor((level - KING_LEVEL) / 4)) : 0,
    currentLevelStart,
    nextLevelAt,
    remaining: nextLevelAt - earned,
    progress: (earned - currentLevelStart) / (nextLevelAt - currentLevelStart),
  };
}
