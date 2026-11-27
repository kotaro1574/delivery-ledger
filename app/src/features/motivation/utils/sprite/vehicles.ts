import {
  drawPart,
  fillEllipse,
  fillRect,
  type PixelGrid,
  thickLine,
} from "@/features/motivation/utils/sprite/canvas";

export const WHITE = "#ffffff";
export const GOLD = "#ffd84a";
export const GOLD_LIGHT = "#fff0a0";
export const GOLD_MID = "#e8a93a";
export const GOLD_DARK = "#b0702a";
export const RED = "#e8504a";
export const RED_LIGHT = "#ff8a70";
export const RED_DARK = "#a83038";
export const CREAM = "#fff6dc";
export const CREAM_DARK = "#d9c9a0";

const TIRE = "#3c4262";
const TIRE_LIGHT = "#7a82a8";
const METAL = "#c8cee6";
const METAL_DARK = "#7d84a6";
const SEAT = "#3a2f48";
const SHADOW = "#080b20";
const SPEED = "#7f88b8";

export function groundShadow(grid: PixelGrid, cx: number, width: number) {
  drawPart(grid, (put) => fillEllipse(put, cx, 46, width, 1.4, () => SHADOW), {
    outline: false,
  });
}

export function speedLines(grid: PixelGrid, y: number) {
  drawPart(
    grid,
    (put) => {
      fillRect(put, 0, y, 5, 1, SPEED);
      fillRect(put, 1, y + 3, 3, 1, SPEED);
      fillRect(put, 0, y + 6, 4, 1, SPEED);
    },
    { outline: false },
  );
}

function wheel(
  grid: PixelGrid,
  cx: number,
  cy: number,
  radius: number,
  tire: number,
) {
  drawPart(grid, (put) => {
    for (let y = Math.floor(cy - radius - 1); y <= cy + radius + 1; y++) {
      for (let x = Math.floor(cx - radius - 1); x <= cx + radius + 1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= radius && d > radius - tire) {
          const lit =
            y + 0.5 < cy - radius * 0.35 && x + 0.5 < cx + radius * 0.3;
          put(x, y, lit ? TIRE_LIGHT : TIRE);
        } else if (d <= radius - tire && d > radius - tire - 1) {
          put(x, y, y < cy ? METAL : METAL_DARK);
        }
      }
    }
    fillRect(put, Math.floor(cx) - 1, Math.floor(cy) - 1, 2, 2, METAL);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [0.7, 0.7],
      [0.7, -0.7],
    ]) {
      for (let k = 2; k < radius - tire - 1; k++) {
        put(cx - 0.5 + dx * k, cy - 0.5 + dy * k, METAL_DARK);
        put(cx - 0.5 - dx * k, cy - 0.5 - dy * k, METAL_DARK);
      }
    }
  });
}

export function bicycle(grid: PixelGrid) {
  groundShadow(grid, 24, 17);
  wheel(grid, 12, 39, 6.5, 2);
  wheel(grid, 36, 39, 6.5, 2);
  drawPart(grid, (put) => {
    thickLine(put, [12, 38], [21, 38], 2, RED);
    thickLine(put, [21, 38], [18, 30], 2, RED);
    thickLine(put, [12, 38], [18, 31], 2, RED);
    thickLine(put, [21, 38], [33, 30], 2, RED);
    thickLine(put, [18, 31], [33, 30], 2, RED_LIGHT);
    thickLine(put, [33, 29], [35, 38], 2, METAL);
    thickLine(put, [33, 29], [32, 24], 2, METAL_DARK);
    fillRect(put, 31, 23, 6, 2, METAL);
  });
}

export function scooter(grid: PixelGrid) {
  groundShadow(grid, 24, 18);
  wheel(grid, 13, 41, 4.5, 2);
  wheel(grid, 36, 41, 4.5, 2);
  drawPart(grid, (put) => {
    for (let y = 31; y <= 38; y++) {
      const left = 9 + Math.max(0, 34 - y);
      for (let x = left; x <= 25; x++) {
        put(x, y, y < 33 ? RED_LIGHT : y > 36 ? RED_DARK : RED);
      }
    }
    fillRect(put, 14, 37, 18, 3, CREAM);
    fillRect(put, 14, 39, 18, 1, CREAM_DARK);
    for (let y = 23; y <= 39; y++) {
      const x0 = 30 + Math.floor((39 - y) * 0.25);
      for (let x = x0; x <= x0 + 4; x++) {
        put(x, y, x === x0 ? RED_LIGHT : x === x0 + 4 ? RED_DARK : RED);
      }
    }
    fillRect(put, 31, 21, 7, 2, METAL);
    fillRect(put, 35, 26, 3, 3, GOLD);
    put(35, 26, WHITE);
    fillRect(put, 11, 30, 14, 2, SEAT);
  });
  drawPart(grid, (put) => {
    fillRect(put, 1, 20, 11, 10, CREAM);
    fillRect(put, 1, 20, 11, 1, WHITE);
    fillRect(put, 9, 21, 3, 9, CREAM_DARK);
    fillRect(put, 3, 23, 5, 4, RED);
    put(5, 24, WHITE);
  });
}

export function deliveryBag(
  grid: PixelGrid,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawPart(grid, (put) => {
    fillRect(put, x, y, width, height, GOLD);
    fillRect(put, x, y, width, 1, GOLD_LIGHT);
    fillRect(put, x + width - 2, y + 1, 2, height - 1, GOLD_MID);
    fillRect(put, x, y + height - 1, width, 1, GOLD_DARK);
    fillRect(put, x + 1, Math.floor(y + height / 2), width - 3, 1, GOLD_DARK);
  });
}

export function deliveryBox(
  grid: PixelGrid,
  x: number,
  y: number,
  size: number,
) {
  drawPart(grid, (put) => {
    fillRect(put, x, y, size, size, GOLD);
    fillRect(put, x, y, size, 1, GOLD_LIGHT);
    fillRect(put, x + size - 2, y + 1, 2, size - 1, GOLD_MID);
    fillRect(put, x, y + size - 1, size, 1, GOLD_DARK);
    fillRect(put, x + 2, y + 3, size - 5, size - 6, GOLD_DARK);
    fillRect(put, x + 3, y + 4, size - 7, size - 8, GOLD_LIGHT);
  });
}
