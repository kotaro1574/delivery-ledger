export type RiderStage = "rookie" | "regular" | "ace" | "veteran" | "legend";

export type LevelInfo = {
  level: number;
  title: string;
  stage: RiderStage;
  currentLevelStart: number;
  nextLevelAt: number;
  progress: number;
  remaining: number;
};

const BASE_COST = 30000;
const COST_STEP = 5000;

const stages: { minLevel: number; stage: RiderStage; title: string }[] = [
  { minLevel: 40, stage: "legend", title: "レジェンド" },
  { minLevel: 30, stage: "veteran", title: "ベテラン" },
  { minLevel: 20, stage: "ace", title: "エース" },
  { minLevel: 10, stage: "regular", title: "レギュラー" },
  { minLevel: 1, stage: "rookie", title: "ルーキー" },
];

function levelCost(level: number) {
  return BASE_COST + COST_STEP * (level - 1);
}

export function stageForLevel(level: number) {
  return (
    stages.find((item) => level >= item.minLevel) ?? stages[stages.length - 1]
  );
}

export function levelFromRevenue(total: number): LevelInfo {
  const revenue = Math.max(0, total);
  let level = 1;
  let currentLevelStart = 0;

  while (revenue >= currentLevelStart + levelCost(level)) {
    currentLevelStart += levelCost(level);
    level += 1;
  }

  const nextLevelAt = currentLevelStart + levelCost(level);
  const { stage, title } = stageForLevel(level);

  return {
    level,
    title,
    stage,
    currentLevelStart,
    nextLevelAt,
    progress: (revenue - currentLevelStart) / (nextLevelAt - currentLevelStart),
    remaining: nextLevelAt - revenue,
  };
}
