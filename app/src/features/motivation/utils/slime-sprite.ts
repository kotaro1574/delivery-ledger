import { evolutionFeatures } from "@/features/motivation/utils/evolution";
import { KING_LEVEL } from "@/features/motivation/utils/monthly-level";
import {
  createGrid,
  drawPart,
  type FacePixel,
  fillEllipse,
  fillRect,
  type PixelGrid,
} from "@/features/motivation/utils/sprite/canvas";
import { bodyPalette } from "@/features/motivation/utils/sprite/color";
import { drawDragonForm } from "@/features/motivation/utils/sprite/dragon-form";
import { drawSlimeForm } from "@/features/motivation/utils/sprite/slime-form";
import {
  CREAM,
  CREAM_DARK,
  groundShadow,
  WHITE,
} from "@/features/motivation/utils/sprite/vehicles";

export type { FacePixel, PixelGrid };

export type PixelRun = { x: number; y: number; width: number; color: string };

const EGG_SPOT = "#7fd36a";

export function composeSlime(level: number) {
  const features = evolutionFeatures(level);
  const palette = bodyPalette(level);
  const grid = createGrid();
  const face =
    features.form === "dragon"
      ? drawDragonForm(grid, features, palette)
      : drawSlimeForm(grid, features, palette);

  const parts = [
    features.form === "dragon" ? "dragon" : "body",
    ...(features.mover === "bicycle" || features.mover === "scooter"
      ? [features.mover]
      : []),
    ...(features.wingSize > 0 ? ["wings"] : []),
    ...(features.king ? ["crown"] : []),
    ...(features.fire ? ["fire"] : []),
    ...Array.from({ length: features.gems }, (_, i) => `gem${i + 1}`),
  ];

  return { grid, parts, face };
}

const ICON_SIZE = 28;
const ICON_ORIGIN = { x: 17, y: 1 };

export function composeAppIcon(): PixelGrid {
  const grid = createGrid();
  drawDragonForm(grid, evolutionFeatures(KING_LEVEL), bodyPalette(KING_LEVEL), {
    scene: false,
  });
  return grid
    .slice(ICON_ORIGIN.y, ICON_ORIGIN.y + ICON_SIZE)
    .map((row) => row.slice(ICON_ORIGIN.x, ICON_ORIGIN.x + ICON_SIZE));
}

export function composeEgg() {
  const grid = createGrid();
  groundShadow(grid, 24, 10);
  drawPart(grid, (put) => {
    fillEllipse(put, 24, 30, 11, 14, (nx, ny) =>
      nx * 0.6 + ny * 0.8 > 0.55
        ? CREAM_DARK
        : nx * 0.6 + ny * 0.8 < -0.6
          ? WHITE
          : CREAM,
    );
    fillRect(put, 18, 24, 3, 3, EGG_SPOT);
    fillRect(put, 27, 30, 4, 3, EGG_SPOT);
    fillRect(put, 20, 36, 3, 2, EGG_SPOT);
  });
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
