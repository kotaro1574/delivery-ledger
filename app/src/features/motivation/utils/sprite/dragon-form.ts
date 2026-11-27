import type { EvolutionFeatures } from "@/features/motivation/utils/evolution";
import {
  drawFace,
  drawPart,
  type FacePixel,
  fillEllipse,
  fillRect,
  INK,
  type PixelGrid,
  type Point,
  type Put,
  SIZE,
  thickLine,
} from "@/features/motivation/utils/sprite/canvas";
import type { BodyPalette } from "@/features/motivation/utils/sprite/color";
import {
  drawWing,
  EYE_GLOW,
  HORN,
  HORN_DARK,
  PINK,
} from "@/features/motivation/utils/sprite/slime-form";
import {
  CREAM,
  CREAM_DARK,
  deliveryBox,
  GOLD,
  GOLD_DARK,
  GOLD_LIGHT,
  GOLD_MID,
  groundShadow,
  speedLines,
  WHITE,
} from "@/features/motivation/utils/sprite/vehicles";

type Ellipse = readonly [x: number, y: number, rx: number, ry: number];

const WING: readonly Point[] = [
  [21, 23],
  [17, 3],
  [14, 11],
  [8, 2],
  [8, 11],
  [1, 9],
  [6, 16],
  [13, 22],
];

const GEM_COLORS = ["#4fc3f7", "#ff5a8a", "#5fd068"];
const RAY_NEAR = "#2a3478";
const RAY_FAR = "#1f2860";
const FLAME_EDGE = "#ff6a3a";

function wingScale(size: number) {
  if (size >= 6) return 1;
  if (size === 5) return 0.8;
  return 0.6;
}

function shapeFor(features: EvolutionFeatures) {
  const adult = features.adult;
  return {
    scale: adult ? 1 : 0.86,
    origin: (features.king || adult ? [23, 25] : [24, 26]) as Point,
    body: (adult ? [22, 30, 10, 8.5] : [22, 30, 11.5, 10]) as Ellipse,
    head: (adult ? [32, 18, 7.5, 6.5] : [31, 19, 8.5, 8]) as Ellipse,
    snout: (features.snout >= 2
      ? [38.5, 20.5, 4.6, 3.6]
      : [37.5, 22, 3.2, 2.6]) as Ellipse,
    neck: features.neck
      ? ([28, 24, adult ? 5 : 4, adult ? 5.5 : 4.5] as Ellipse)
      : null,
    leg: (adult ? [18, 38, 3.4, 2.6] : [17, 39, 3.4, 2.4]) as Ellipse,
    tail: adult ? 1 : 0.75,
  };
}

export function drawDragonForm(
  grid: PixelGrid,
  features: EvolutionFeatures,
  palette: BodyPalette,
): FacePixel[] {
  const shape = shapeFor(features);
  const s = shape.scale;
  const [ox, oy] = shape.origin;
  const at = (x: number, y: number): Point => [
    ox + (x - 24) * s,
    oy + (y - 26) * s,
  ];
  const tone = (nx: number, ny: number) => {
    const light = nx * 0.5 + ny * 0.85;
    if (light < -0.6) return palette.hi;
    if (light > 0.75) return palette.dark;
    if (light > 0.3) return palette.mid;
    return palette.base;
  };
  const blob = (put: Put, [x, y, rx, ry]: Ellipse) => {
    const [cx, cy] = at(x, y);
    fillEllipse(put, cx, cy, rx * s, ry * s, (nx, ny) => tone(nx, ny));
  };

  if (features.king) drawRays(grid);
  speedLines(grid, 22);
  groundShadow(grid, 24, features.king ? 11 : 9);

  const wingSize = wingScale(features.wingSize);
  const wingPoints = WING.map(
    ([x, y]): Point => at(21 + (x - 21) * wingSize, 22 + (y - 23) * wingSize),
  );
  if (features.king) {
    drawWing(
      grid,
      WING.map(([x, y]) => at(x + 4, y - 3)),
      GOLD_DARK,
      "#8a5a1e",
      GOLD_MID,
      true,
    );
  }
  drawWing(
    grid,
    wingPoints,
    features.king ? GOLD_MID : palette.mid,
    features.king ? GOLD_DARK : palette.dark,
    features.king ? GOLD_LIGHT : palette.hi,
    features.wingClaws,
  );

  drawPart(grid, (put) => {
    const tailPoints = [
      [14, 32, 3.4],
      [9, 35, 2.8],
      [5, 34, 2.2],
      [3, 30, 1.6],
    ].map(([x, y, r]) => [
      14 + (x - 14) * shape.tail,
      32 + (y - 32) * shape.tail,
      r,
    ]);
    for (let i = 0; i < tailPoints.length - 1; i++) {
      const [x0, y0, r0] = tailPoints[i];
      const [x1, y1, r1] = tailPoints[i + 1];
      for (let t = 0; t <= 1; t += 0.05) {
        const [cx, cy] = at(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        const r = (r0 + (r1 - r0) * t) * s;
        fillEllipse(put, cx, cy, r, r, (nx, ny) => tone(nx, ny));
      }
    }
    const tip = tailPoints[tailPoints.length - 1];
    const [tx, ty] = at(tip[0], tip[1] - 2.5);
    fillEllipse(put, tx, ty, 1.8 * s, 2.2 * s, () => HORN);
    if (features.tailLength >= 4) {
      for (const [x, y] of tailPoints.slice(0, 3)) {
        const [px, py] = at(x, y - 3.6);
        put(px, py, HORN);
        put(px, py - 1, WHITE);
      }
    }

    blob(put, shape.body);
    blob(put, shape.leg);
    if (shape.neck) blob(put, shape.neck);
    blob(put, shape.head);
    blob(put, shape.snout);

    const [bx, by, brx, bry] = shape.body;
    const [bcx, bcy] = at(bx, by);
    fillEllipse(put, bcx, bcy, brx * s, bry * s, (nx, ny, _x, y) =>
      nx > 0.2 && ny > -0.4
        ? features.bellyStripes && y % 2 === 0
          ? CREAM
          : CREAM_DARK
        : null,
    );
    if (shape.neck) {
      const [nx0, ny0, nrx, nry] = shape.neck;
      const [ncx, ncy] = at(nx0, ny0);
      fillEllipse(put, ncx, ncy, nrx * s, nry * s, (nx, _ny, _x, y) =>
        nx > 0.3 ? (y % 2 === 0 ? CREAM : CREAM_DARK) : null,
      );
    }
    for (const [x, y] of (
      [
        [13, 22],
        [17, 21],
        [21, 21.5],
      ] as const
    ).slice(0, features.backSpikes)) {
      const [px, py] = at(x, y);
      put(px, py - 1, HORN);
      put(px, py, HORN_DARK);
    }
    if (features.claws) {
      const [lx, ly] = at(shape.leg[0] + 2, shape.leg[1] + 2);
      put(lx, ly, WHITE);
      put(lx + 1, ly, WHITE);
    }
  });

  drawPart(grid, (put) => {
    const reach = features.hornLength >= 6 ? 1 : 0.6;
    const tip = features.king ? GOLD : WHITE;
    const horns: [Point, Point][] = [
      [
        [29, 13],
        [23, 7],
      ],
      [
        [32, 12],
        [29, 5],
      ],
    ];
    for (const [base, top] of horns) {
      const end: Point = [
        base[0] + (top[0] - base[0]) * reach,
        base[1] + (top[1] - base[1]) * reach,
      ];
      thickLine(put, at(...base), at(...end), 2, HORN);
      const [ex, ey] = at(...end);
      put(ex, ey - 1, tip);
      put(ex + 1, ey - 1, tip);
    }
  });

  if (features.king) drawKingDecor(grid, at, features.gems);

  const boxAt = at(features.adult ? 27 : 28, features.adult ? 33 : 34);
  deliveryBox(
    grid,
    Math.round(boxAt[0]),
    Math.round(boxAt[1]),
    Math.round(8 * s),
  );
  drawPart(grid, (put) => {
    const [cx, cy] = at(features.adult ? 29.5 : 30.5, features.adult ? 33 : 34);
    fillEllipse(put, cx, cy, 2.6 * s, 2 * s, (nx, ny) => tone(nx, ny));
    if (features.claws) put(cx + 2, cy + 1, WHITE);
  });

  if (features.fire)
    drawFire(grid, at(shape.snout[0] + shape.snout[2] + 1, shape.snout[1] + 1));

  return drawDragonFace(grid, at, shape, features);
}

function drawRays(grid: PixelGrid) {
  drawPart(
    grid,
    (put) => {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24);
          const angle = Math.atan2(y + 0.5 - 24, x + 0.5 - 24);
          const lit = Math.floor((angle + Math.PI) / (Math.PI / 8)) % 2 === 0;
          if (d > 9 && d < 26 && lit) put(x, y, d < 17 ? RAY_NEAR : RAY_FAR);
        }
      }
    },
    { outline: false },
  );
}

function drawKingDecor(
  grid: PixelGrid,
  at: (x: number, y: number) => Point,
  gems: number,
) {
  drawPart(grid, (put) => {
    const [cx, cy] = at(29, 10);
    const x = Math.round(cx);
    const y = Math.round(cy);
    fillRect(put, x, y, 9, 3, GOLD);
    fillRect(put, x, y + 2, 9, 1, GOLD_MID);
    for (const px of [x, x + 4, x + 8]) {
      put(px, y - 1, GOLD);
      put(px, y - 2, GOLD_LIGHT);
    }
    [x + 2, x + 4, x + 6].forEach((gx, i) => {
      put(gx, y + 1, i < gems ? GEM_COLORS[i] : GOLD_DARK);
    });
  });
  drawPart(grid, (put) => {
    const [gx, gy] = at(26, 26);
    const x = Math.round(gx);
    const y = Math.round(gy);
    fillRect(put, x, y, 3, 3, "#ff4a7a");
    put(x, y, WHITE);
    put(x + 2, y + 2, "#b0204a");
  });
}

function drawFire(grid: PixelGrid, [fx, fy]: Point) {
  drawPart(grid, (put) => {
    for (let i = 0; i < 6; i++) {
      const half = Math.floor(i / 2) + 1;
      for (let k = -half; k <= half; k++) {
        const color = Math.abs(k) === half ? FLAME_EDGE : i < 2 ? WHITE : GOLD;
        put(fx + i, fy + k, color);
      }
    }
  });
}

function drawDragonFace(
  grid: PixelGrid,
  at: (x: number, y: number) => Point,
  shape: ReturnType<typeof shapeFor>,
  features: EvolutionFeatures,
) {
  const [hx, hy] = shape.head;
  const [sx, sy, srx] = shape.snout;
  return drawFace(grid, (put) => {
    const [ex, ey] = at(34, features.adult ? 15.5 : 16.5);
    const x = Math.round(ex);
    const y = Math.round(ey);
    if (features.sharpEyes) {
      fillRect(put, x, y, 2, 3, INK);
      put(x, y, WHITE);
      put(x - 1, y - 2, INK);
      put(x, y - 2, INK);
      put(x + 1, y - 1, INK);
      put(x + 2, y - 1, INK);
    } else {
      fillRect(put, x, y, 3, 4, INK);
      put(x, y, WHITE);
      put(x + 1, y, WHITE);
      put(x, y + 1, WHITE);
      put(x + 2, y + 3, EYE_GLOW);
    }
    const [nx, ny] = at(sx + srx * 0.6, sy - 1.5);
    put(nx, ny, INK);
    const [mx, my] = at(sx - 2.5, sy + 2);
    for (let i = 0; i < 5; i++)
      put(Math.round(mx + i), Math.round(my - i * 0.25), INK);
    if (features.fangs) put(Math.round(mx + 1), Math.round(my + 1), WHITE);
    const [bx, by] = at(hx - 1, hy + 3);
    fillRect(put, Math.round(bx), Math.round(by), 2, 1, PINK);
  });
}
