import type { SlimeTier } from "@/features/motivation/utils/monthly-level";

export type PixelGrid = (string | null)[][];

export type SlimeLook = {
  tier: SlimeTier;
  step: number;
  gems: number;
};

export type PixelRun = { x: number; y: number; width: number; color: string };

const SIZE = 32;

const INK = "#22201a";
const CREAM = "#fbf9f3";
const GOLD = "#e0a83a";
const GOLD_DARK = "#a8741e";
const SCARF = "#d9534f";
const PINK = "#f4a6a6";
const LENS = "#8fd3f4";
const WHITE = "#ffffff";
const PATCH = "#4fa3d9";
const CAPE = "#b23a48";
const METAL = "#6b665a";
const AURA = "rgba(242, 201, 76, 0.35)";
const SHADOW = "rgba(34, 32, 26, 0.12)";
const GEM_COLORS = ["#4fc3f7", "#e05a7a", "#5fd068"];

const bodyPalettes: Record<SlimeTier, { B: string; S: string; H: string }> = {
  0: { B: "#7cc46a", S: "#4f9a46", H: "#c9efb8" },
  1: { B: "#6cb8e6", S: "#3f88b8", H: "#c8e8fa" },
  2: { B: "#a07ad8", S: "#6f4fae", H: "#dcc8f5" },
  3: { B: "#f0a04a", S: "#c0722a", H: "#fbd7a8" },
  4: { B: "#f2c94c", S: "#c08a2e", H: "#fff0b8" },
};

const BODY = [
  "......OOOO......",
  "....OOBBBBOO....",
  "...OBBBBBBBBO...",
  "..OBBHHBBBBBBO..",
  "..OBHHBBBBBBBO..",
  ".OBBHBBBBBBBBBO.",
  ".OBBBBBBBBBBBBO.",
  "OBBBBBBBBBBBBBBO",
  "OBBBBBBBBBBBBBBO",
  "OBBBBBBBBBBBBBBO",
  "OBBBBBBBBBBBBBBO",
  "OSBBBBBBBBBBBBSO",
  ".OSSBBBBBBBBSSO.",
  "..OOOOOOOOOOOO..",
];

const HELMET = [
  ".....OOOOOO.....",
  "...OOKKKKKKOO...",
  "..OKKKKKKKKKKO..",
  "..OOOOOOOOOOOOOO",
];

const BAG = [
  "OOOOOOO",
  "OGGGGGO",
  "OGGGGGO",
  "ODDDDDO",
  "OGGGGGO",
  "OGGGGGO",
  "OOOOOOO",
];

const GOGGLES = ["...OOOOOOOOOO...", "...OLLLOOLLLO...", "...OOOOOOOOOO..."];

const CROWN = [
  ".O...O...O.",
  "OGO.OGO.OGO",
  "OGGOGGGOGGO",
  "OGGGGGGGGGO",
  "OGGGGGGGGGO",
  "OOOOOOOOOOO",
];

function createGrid(): PixelGrid {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null),
  );
}

function setPixel(grid: PixelGrid, x: number, y: number, color: string) {
  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
    grid[y][x] = color;
  }
}

function stamp(
  grid: PixelGrid,
  sprite: string[],
  x: number,
  y: number,
  palette: Record<string, string>,
) {
  sprite.forEach((row, dy) => {
    [...row].forEach((key, dx) => {
      const color = palette[key];
      if (color) {
        setPixel(grid, x + dx, y + dy, color);
      }
    });
  });
}

function line(
  grid: PixelGrid,
  from: [number, number],
  to: [number, number],
  color: string,
) {
  let [x0, y0] = from;
  const [x1, y1] = to;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    setPixel(grid, x0, y0, color);
    if (x0 === x1 && y0 === y1) {
      return;
    }
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}

function rect(
  grid: PixelGrid,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      setPixel(grid, x + dx, y + dy, color);
    }
  }
}

function ring(
  grid: PixelGrid,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  for (let y = cy - radius - 1; y <= cy + radius + 1; y += 1) {
    for (let x = cx - radius - 1; x <= cx + radius + 1; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (Math.abs(distance - radius) < 0.5) {
        setPixel(grid, x, y, color);
      }
    }
  }
}

function ellipse(
  grid: PixelGrid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
        setPixel(grid, x, y, color);
      }
    }
  }
}

function sparkle(grid: PixelGrid, cx: number, cy: number) {
  setPixel(grid, cx, cy, WHITE);
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    setPixel(grid, cx + dx, cy + dy, GOLD);
  }
}

function wheel(grid: PixelGrid, cx: number, cy: number, radius: number) {
  ring(grid, cx, cy, radius, INK);
  setPixel(grid, cx, cy, INK);
}

const vehicleParts: Record<SlimeTier, string | null> = {
  0: null,
  1: "bicycle",
  2: "eBike",
  3: "scooter",
  4: "motorbike",
};

function drawVehicleBack(grid: PixelGrid, tier: SlimeTier) {
  if (tier === 1 || tier === 2) {
    wheel(grid, 7, 26, 4);
    wheel(grid, 25, 26, 4);
    line(grid, [7, 26], [13, 22], INK);
    line(grid, [13, 22], [21, 22], INK);
    line(grid, [21, 22], [25, 26], INK);
    line(grid, [7, 26], [16, 26], INK);
    line(grid, [16, 26], [21, 22], INK);
    if (tier === 2) {
      rect(grid, 14, 23, 3, 2, GOLD);
      line(grid, [0, 19], [3, 19], GOLD);
      line(grid, [0, 22], [2, 22], GOLD);
    }
  }

  if (tier === 3) {
    wheel(grid, 8, 27, 3);
    wheel(grid, 24, 27, 3);
    rect(grid, 6, 22, 17, 3, GOLD);
    line(grid, [6, 25], [22, 25], INK);
    rect(grid, 21, 18, 4, 7, GOLD);
    line(grid, [25, 18], [25, 24], INK);
    line(grid, [0, 20], [3, 20], GOLD);
    line(grid, [0, 23], [2, 23], GOLD);
  }

  if (tier === 4) {
    wheel(grid, 6, 26, 4);
    ring(grid, 6, 26, 2, METAL);
    wheel(grid, 26, 26, 4);
    ring(grid, 26, 26, 2, METAL);
    rect(grid, 9, 21, 15, 3, GOLD);
    line(grid, [10, 24], [22, 24], INK);
    rect(grid, 12, 25, 7, 2, METAL);
    line(grid, [4, 23], [12, 23], METAL);
    line(grid, [0, 18], [3, 18], GOLD);
    line(grid, [0, 21], [2, 21], GOLD);
  }
}

function drawVehicleFront(grid: PixelGrid, tier: SlimeTier) {
  if (tier === 1 || tier === 2) {
    line(grid, [25, 26], [24, 18], INK);
    line(grid, [23, 17], [26, 17], INK);
  }
  if (tier === 3) {
    line(grid, [24, 24], [25, 15], INK);
    line(grid, [24, 15], [27, 15], INK);
  }
  if (tier === 4) {
    line(grid, [26, 26], [25, 17], INK);
    line(grid, [24, 17], [28, 17], INK);
  }
}

export function composeSlime({ tier, step, gems }: SlimeLook) {
  const grid = createGrid();
  const parts: string[] = [];
  const riding = tier > 0;
  const bodyX = 8;
  const bodyY = riding ? 8 : 16;
  const body = bodyPalettes[tier];
  const has = (needed: number) => step >= needed;

  if (has(9)) {
    ellipse(grid, bodyX + 7.5, bodyY + 6.5, 11, 10, AURA);
    parts.push("aura");
  }

  if (tier === 4) {
    for (let dy = 0; dy < 10; dy += 1) {
      const width = 3 + Math.floor(dy / 2);
      rect(grid, bodyX + 2 - width, bodyY + 5 + dy, width, 1, CAPE);
    }
  }

  if (riding) {
    drawVehicleBack(grid, tier);
  } else {
    rect(grid, bodyX + 1, bodyY + 14, 14, 1, SHADOW);
  }

  stamp(grid, BAG, bodyX - 5, bodyY + 3, { O: INK, G: GOLD, D: GOLD_DARK });
  stamp(grid, BODY, bodyX, bodyY, { O: INK, ...body });
  parts.push("body", "bag");

  setPixel(grid, bodyX + 5, bodyY + 6, INK);
  setPixel(grid, bodyX + 5, bodyY + 7, INK);
  setPixel(grid, bodyX + 10, bodyY + 6, INK);
  setPixel(grid, bodyX + 10, bodyY + 7, INK);
  setPixel(grid, bodyX + 6, bodyY + 9, INK);
  setPixel(grid, bodyX + 9, bodyY + 9, INK);
  rect(grid, bodyX + 7, bodyY + 10, 2, 1, INK);

  const king = tier === 4;
  if (!king) {
    stamp(grid, HELMET, bodyX, bodyY - 2, { O: INK, K: CREAM });
    parts.push("helmet");
  }

  if (has(1)) {
    rect(grid, bodyX + 3, bodyY + 8, 2, 1, PINK);
    rect(grid, bodyX + 11, bodyY + 8, 2, 1, PINK);
    parts.push("blush");
  }

  if (has(2) && !king) {
    setPixel(grid, bodyX + 7, bodyY - 1, GOLD);
    rect(grid, bodyX + 6, bodyY, 3, 1, GOLD);
    parts.push("star");
  }

  if (has(3)) {
    rect(grid, bodyX + 1, bodyY + 11, 14, 1, SCARF);
    rect(grid, bodyX + 2, bodyY + 12, 12, 1, SCARF);
    setPixel(grid, bodyX, bodyY + 12, SCARF);
    setPixel(grid, bodyX - 1, bodyY + 13, SCARF);
    parts.push("scarf");
  }

  if (has(4)) {
    rect(grid, bodyX - 3, bodyY + 4, 2, 2, PATCH);
    parts.push("patch");
  }

  if (has(5)) {
    stamp(grid, GOGGLES, bodyX, bodyY + 2, { O: INK, L: LENS });
    parts.push("goggles");
  }

  if (has(6)) {
    sparkle(grid, 28, 4);
    parts.push("sparkle1");
  }

  if (has(7)) {
    sparkle(grid, 3, 3);
    parts.push("sparkle2");
  }

  if (has(8)) {
    rect(grid, bodyX - 4, bodyY + 12, 4, 1, SCARF);
    rect(grid, bodyX - 5, bodyY + 13, 4, 1, SCARF);
    parts.push("longScarf");
  }

  const vehicle = vehicleParts[tier];
  if (vehicle) {
    drawVehicleFront(grid, tier);
    parts.push(vehicle);
  }

  if (king) {
    stamp(grid, CROWN, bodyX + 2, bodyY - 4, { O: INK, G: GOLD });
    parts.push("crown", "cape");
    for (let index = 0; index < gems; index += 1) {
      setPixel(grid, bodyX + 4 + index * 3, bodyY - 1, GEM_COLORS[index]);
      parts.push(`gem${index + 1}`);
    }
  }

  return { grid, parts };
}

export function composeEgg() {
  const grid = createGrid();
  ellipse(grid, 15.5, 19, 8, 10, INK);
  ellipse(grid, 15.5, 19, 7, 9, CREAM);
  rect(grid, 11, 15, 2, 2, "#7cc46a");
  rect(grid, 18, 19, 3, 2, "#7cc46a");
  rect(grid, 13, 23, 2, 2, "#7cc46a");
  rect(grid, 10, 30, 12, 1, SHADOW);
  return grid;
}

export function toRuns(grid: PixelGrid): PixelRun[] {
  const runs: PixelRun[] = [];

  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = row[x];
      if (!color) {
        x += 1;
        continue;
      }
      let width = 1;
      while (row[x + width] === color) {
        width += 1;
      }
      runs.push({ x, y, width, color });
      x += width;
    }
  });

  return runs;
}
