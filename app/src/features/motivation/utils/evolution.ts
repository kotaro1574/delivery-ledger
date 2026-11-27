export type Mover = "walk" | "bicycle" | "scooter" | "fly";

export type EvolutionFeatures = {
  form: "slime" | "dragon";
  mover: Mover;
  king: boolean;
  blush: boolean;
  capStripe: boolean;
  bigBag: boolean;
  eyeShines: 1 | 2;
  bodyStage: number;
  hornLength: number;
  hornCurl: boolean;
  tailLength: number;
  tailSpike: boolean;
  backSpikes: number;
  wingSize: number;
  wingClaws: boolean;
  brows: boolean;
  snout: number;
  bellyStripes: boolean;
  fangs: boolean;
  claws: boolean;
  neck: boolean;
  sharpEyes: boolean;
  adult: boolean;
  fire: boolean;
  gems: number;
};

export const formNames = [
  "はいたつスライム",
  "ツノスライム",
  "ハネスライム",
  "チビドラゴン",
  "キングドラゴン",
] as const;

type Threshold = readonly [level: number, value: number];

function stage(level: number, thresholds: readonly Threshold[]) {
  return thresholds.reduce(
    (value, [from, next]) => (level >= from ? next : value),
    0,
  );
}

function moverFor(level: number): Mover {
  if (level <= 10) return "walk";
  if (level <= 20) return "bicycle";
  if (level <= 30) return "scooter";
  return "fly";
}

export function formName(level: number) {
  return formNames[Math.min(4, Math.max(0, Math.floor((level - 1) / 10)))];
}

export function evolutionFeatures(level: number): EvolutionFeatures {
  return {
    form: level >= 31 ? "dragon" : "slime",
    mover: moverFor(level),
    king: level >= 41,
    blush: level >= 2,
    capStripe: level >= 3,
    bigBag: level >= 5,
    eyeShines: level >= 7 ? 2 : 1,
    bodyStage: stage(level, [
      [10, 1],
      [40, 2],
    ]),
    hornLength: stage(level, [
      [4, 1],
      [6, 2],
      [9, 3],
      [14, 4],
      [30, 5],
      [36, 6],
    ]),
    hornCurl: level >= 19,
    tailLength: stage(level, [
      [8, 1],
      [12, 2],
      [25, 3],
      [37, 4],
    ]),
    tailSpike: level >= 15,
    backSpikes: stage(level, [
      [13, 1],
      [17, 2],
      [23, 3],
    ]),
    wingSize: stage(level, [
      [16, 1],
      [18, 2],
      [22, 3],
      [27, 4],
      [35, 5],
      [39, 6],
    ]),
    wingClaws: level >= 24,
    brows: level >= 20,
    snout: stage(level, [
      [26, 1],
      [34, 2],
    ]),
    bellyStripes: level >= 28,
    fangs: level >= 29,
    claws: level >= 32,
    neck: level >= 33,
    sharpEyes: level >= 38,
    adult: level >= 40,
    fire: level >= 43,
    gems: level >= 41 ? Math.min(3, Math.floor((level - 41) / 4)) : 0,
  };
}
