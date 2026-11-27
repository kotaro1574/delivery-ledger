import type { EvolutionFeatures } from "@/features/motivation/utils/evolution";
import {
  drawFace,
  drawPart,
  type FacePixel,
  fillPolygon,
  fillRect,
  INK,
  type PixelGrid,
  type Point,
  type Put,
} from "@/features/motivation/utils/sprite/canvas";
import type { BodyPalette } from "@/features/motivation/utils/sprite/color";
import {
  bicycle,
  CREAM,
  CREAM_DARK,
  deliveryBag,
  GOLD,
  groundShadow,
  scooter,
  speedLines,
  WHITE,
} from "@/features/motivation/utils/sprite/vehicles";

export const HORN = "#fff3d0";
export const HORN_DARK = "#c9b48a";
export const PINK = "#ff9db0";
export const EYE_GLOW = "#5a6bd0";

type Body = {
  cx: number;
  bottom: number;
  rx: number;
  h: number;
  cy: number;
  ryTop: number;
  ryBottom: number;
};

export const WING_SHAPE: readonly Point[] = [
  [14, 18],
  [11, 2],
  [10, 9],
  [5, 3],
  [6, 11],
  [1, 9],
  [5, 15],
  [11, 19],
];

function layout(features: EvolutionFeatures): Body {
  const grow = features.bodyStage;
  const base =
    features.mover === "walk"
      ? { cx: 24, bottom: 45, rx: 10.5 + grow, h: 18 + grow }
      : features.mover === "bicycle"
        ? { cx: 20, bottom: 32, rx: 10.5, h: 19 }
        : { cx: 19, bottom: 31, rx: 11, h: 20 };
  const ryTop = base.h * 0.6;
  const ryBottom = base.h * 0.4;
  return { ...base, ryTop, ryBottom, cy: base.bottom - ryBottom };
}

function insideBody(body: Body, x: number, y: number) {
  const dy = y + 0.5 - body.cy;
  const ny = dy < 0 ? dy / body.ryTop : dy / body.ryBottom;
  const squeeze = dy < 0 ? 1 - 0.22 * ny * ny : 1;
  const nx = (x + 0.5 - body.cx) / (body.rx * squeeze);
  const hit = dy < 0 ? nx * nx + ny * ny <= 1 : nx ** 4 + ny ** 4 <= 1;
  return { hit, nx, ny };
}

function shadeBody(
  palette: BodyPalette,
  nx: number,
  ny: number,
  below: boolean,
) {
  const light = nx * 0.55 + (below ? ny * 1.2 : ny) * 0.85;
  if (light < -0.62) return palette.hi;
  if (light > 0.78) return palette.dark;
  if (light > 0.32) return palette.mid;
  return palette.base;
}

function eyeRow(body: Body) {
  return Math.round(body.cy - body.ryTop * 0.28);
}

function drawBody(
  grid: PixelGrid,
  body: Body,
  palette: BodyPalette,
  features: EvolutionFeatures,
) {
  drawPart(grid, (put) => {
    for (let y = Math.floor(body.bottom - body.h - 1); y < body.bottom; y++) {
      for (
        let x = Math.floor(body.cx - body.rx - 2);
        x <= body.cx + body.rx + 2;
        x++
      ) {
        const { hit, nx, ny } = insideBody(body, x, y);
        if (!hit) continue;
        const stripe =
          features.bellyStripes &&
          y + 0.5 > body.cy + body.ryBottom * 0.5 &&
          nx > -0.2 &&
          y % 2 === 0;
        put(
          x,
          y,
          stripe
            ? palette.hi
            : shadeBody(palette, nx, ny, ny > 0 && y + 0.5 > body.cy),
        );
      }
    }
    if (features.snout > 0) {
      const sy = eyeRow(body) + 4;
      const sx = Math.round(body.cx + body.rx - 1);
      fillRect(put, sx, sy, 3, 3, palette.base);
      fillRect(put, sx, sy + 2, 3, 1, palette.mid);
      put(sx + 2, sy, palette.hi);
    }
    const sx = Math.round(body.cx - body.rx * 0.5);
    const sy = Math.round(body.cy - body.ryTop * 0.55);
    fillRect(put, sx, sy, 2, 3, palette.spec);
    put(sx + 2, sy - 1, palette.spec);
    put(sx - 1, sy + 4, palette.spec);
  });
}

function drawCap(grid: PixelGrid, body: Body, stripe: boolean) {
  const cut = body.cy - body.ryTop * 0.6;
  drawPart(grid, (put) => {
    for (let y = Math.floor(body.bottom - body.h - 2); y <= cut; y++) {
      for (
        let x = Math.floor(body.cx - body.rx - 2);
        x <= body.cx + body.rx + 2;
        x++
      ) {
        const ny = (y + 0.5 - body.cy) / (body.ryTop + 0.8);
        const squeeze = 1 - 0.22 * ny * ny;
        const nx = (x + 0.5 - body.cx) / ((body.rx + 0.8) * squeeze);
        if (nx * nx + ny * ny > 1) continue;
        const light = nx * 0.6 + ny * 0.8;
        let color = light < -0.75 ? WHITE : light > 0.35 ? CREAM_DARK : CREAM;
        if (stripe && Math.abs(x + 0.5 - body.cx) < 1.5) color = GOLD;
        put(x, y, color);
      }
    }
    const brim = Math.round(cut) + 1;
    for (
      let x = Math.round(body.cx + body.rx * 0.2);
      x <= Math.round(body.cx + body.rx * 0.7) + 2;
      x++
    ) {
      put(x, brim, CREAM_DARK);
    }
  });
}

function drawHorns(grid: PixelGrid, body: Body, length: number, curl: boolean) {
  const top = body.bottom - body.h;
  drawPart(grid, (put) => {
    for (const side of [-1, 1]) {
      const baseX = Math.round(body.cx + side * body.rx * 0.45);
      for (let i = 0; i < length; i++) {
        const width = Math.max(1, Math.round((length - i) * 0.6));
        const lean = curl && i >= length - 2 ? side : 0;
        const x = baseX - Math.round(i * 0.4) + lean;
        for (let k = 0; k < width; k++) {
          const tip = i === length - 1;
          put(
            x + k,
            Math.round(top + 1 - i),
            tip ? WHITE : k === width - 1 ? HORN_DARK : HORN,
          );
        }
      }
    }
  });
}

function drawTail(
  grid: PixelGrid,
  body: Body,
  palette: BodyPalette,
  length: number,
  spike: boolean,
) {
  const reach = length * 3;
  drawPart(grid, (put) => {
    const y = Math.round(body.bottom - 4);
    const x = Math.round(body.cx - body.rx + 2);
    for (let i = 0; i < reach + 2; i++) {
      const wave = Math.round(i * 0.55);
      put(x - i, y - wave, palette.mid);
      put(x - i, y - wave + 1, palette.dark);
    }
    if (spike) {
      const tx = x - reach - 2;
      const ty = y - Math.round((reach + 1) * 0.55);
      fillRect(put, tx - 1, ty - 1, 2, 2, HORN);
      put(tx - 2, ty, HORN);
      put(tx, ty - 2, HORN);
    }
  });
}

function drawBackSpikes(grid: PixelGrid, body: Body, count: number) {
  drawPart(grid, (put) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * (1.08 + i * 0.13);
      const ex = body.cx + Math.cos(angle) * body.rx * 0.93;
      const ey = body.cy + Math.sin(angle) * body.ryTop * 0.93;
      const ox = Math.cos(angle);
      const oy = Math.sin(angle);
      for (let k = 0; k < 4; k++) {
        const half = Math.max(0, 1 - Math.floor(k / 2));
        for (let w = -half; w <= half; w++) {
          put(
            ex + ox * k - oy * w,
            ey + oy * k + ox * w,
            k === 3 ? WHITE : HORN,
          );
        }
      }
    }
  });
}

function drawSlimeWings(
  grid: PixelGrid,
  body: Body,
  palette: BodyPalette,
  size: number,
  claws: boolean,
) {
  const scale = [0, 0.45, 0.6, 0.75, 0.9][size];
  const sx = body.cx - body.rx + 6;
  const sy = body.cy - body.ryTop * 0.2;
  const points = WING_SHAPE.map(
    ([x, y]): Point => [
      sx + (x - 14) * scale * 1.4,
      sy + (y - 18) * scale * 1.4,
    ],
  );
  drawWing(grid, points, palette.mid, palette.dark, palette.hi, claws);
}

export function drawWing(
  grid: PixelGrid,
  points: Point[],
  membrane: string,
  membraneDark: string,
  bone: string,
  claws: boolean,
) {
  drawPart(grid, (put) => {
    fillPolygon(put, points, (x, y) =>
      (x + y) % 7 === 0 ? membraneDark : membrane,
    );
    const shoulder = points[0];
    for (const i of [1, 3, 5]) {
      boneLine(put, shoulder, points[i], bone);
      if (claws) put(points[i][0], points[i][1], WHITE);
    }
  });
}

function boneLine(put: Put, from: Point, to: Point, color: string) {
  const steps =
    Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    put(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      color,
    );
  }
}

function drawHand(grid: PixelGrid, palette: BodyPalette, x: number, y: number) {
  drawPart(grid, (put) => {
    fillRect(put, x, y, 3, 2, palette.base);
    put(x, y, palette.hi);
  });
}

function drawSlimeFace(
  grid: PixelGrid,
  body: Body,
  features: EvolutionFeatures,
) {
  const ex = body.cx + 1.5;
  const ey = eyeRow(body);
  const gap = Math.max(3, Math.round(body.rx * 0.42));
  const left = Math.round(ex - gap);
  const right = Math.round(ex + gap) - 1;
  const eyeHeight = features.mover === "walk" ? 3 : 4;
  return drawFace(grid, (put) => {
    for (const x of [left, right]) {
      fillRect(put, x, ey, 2, eyeHeight, INK);
      put(x, ey, WHITE);
      if (features.eyeShines === 2) put(x + 1, ey + eyeHeight - 1, EYE_GLOW);
    }
    if (features.brows) {
      put(left - 1, ey - 2, INK);
      put(left, ey - 2, INK);
      put(left + 1, ey - 1, INK);
      put(left + 2, ey - 1, INK);
      put(right + 2, ey - 2, INK);
      put(right + 1, ey - 2, INK);
      put(right, ey - 1, INK);
      put(right - 1, ey - 1, INK);
    }
    const my = ey + eyeHeight + 2;
    const mx = Math.round(ex) - 1;
    put(mx - 1, my - 1, INK);
    fillRect(put, mx, my, 2, 1, INK);
    put(mx + 2, my - 1, INK);
    if (features.fangs) {
      put(mx - 1, my, WHITE);
      put(mx + 2, my, WHITE);
    }
    if (features.blush) {
      fillRect(put, left - 2, ey + eyeHeight, 2, 1, PINK);
      fillRect(put, right + 2, ey + eyeHeight, 2, 1, PINK);
    }
  });
}

export function drawSlimeForm(
  grid: PixelGrid,
  features: EvolutionFeatures,
  palette: BodyPalette,
): FacePixel[] {
  const body = layout(features);
  if (features.mover === "walk") groundShadow(grid, 23, 11);
  if (features.mover === "scooter") speedLines(grid, 26);
  if (features.wingSize > 0) {
    drawSlimeWings(grid, body, palette, features.wingSize, features.wingClaws);
  }
  if (features.mover === "bicycle") bicycle(grid);
  if (features.mover === "scooter") scooter(grid);
  if (features.tailLength > 0) {
    drawTail(grid, body, palette, features.tailLength, features.tailSpike);
  }
  if (features.backSpikes > 0) drawBackSpikes(grid, body, features.backSpikes);
  if (features.mover === "walk") {
    const size = features.bigBag ? [9, 10] : [7, 8];
    deliveryBag(
      grid,
      Math.round(body.cx - body.rx - size[0] + 4),
      45 - size[1] - 4,
      size[0],
      size[1],
    );
  }
  drawBody(grid, body, palette, features);
  if (features.mover === "walk") drawCap(grid, body, features.capStripe);
  if (features.hornLength > 0) {
    drawHorns(grid, body, features.hornLength, features.hornCurl);
  }
  if (features.mover === "bicycle") {
    drawHand(grid, palette, 30, 24);
    deliveryBag(grid, 35, 24, 7, 6);
  }
  if (features.mover === "scooter") drawHand(grid, palette, 29, 22);
  return drawSlimeFace(grid, body, features);
}
