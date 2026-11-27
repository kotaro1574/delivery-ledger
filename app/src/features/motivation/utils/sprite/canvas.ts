export const SIZE = 48;
export const INK = "#120e26";

export type PixelGrid = (string | null)[][];
export type Put = (x: number, y: number, color: string) => void;
export type Point = [number, number];

const NEIGHBORS: readonly Point[] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function createGrid(): PixelGrid {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null),
  );
}

function inside(x: number, y: number) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

export function drawPart(
  grid: PixelGrid,
  draw: (put: Put) => void,
  { outline = true }: { outline?: boolean } = {},
) {
  const layer = createGrid();
  draw((x, y, color) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (inside(px, py)) {
      layer[py][px] = color;
    }
  });

  if (outline) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (layer[y][x]) continue;
        const touches = NEIGHBORS.some(([dx, dy]) => {
          const color = layer[y + dy]?.[x + dx];
          return Boolean(color) && color !== INK;
        });
        if (touches) grid[y][x] = INK;
      }
    }
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const color = layer[y][x];
      if (color) grid[y][x] = color;
    }
  }
}

export function fillEllipse(
  put: Put,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: (nx: number, ny: number, x: number, y: number) => string | null,
) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        const value = color(nx, ny, x, y);
        if (value) put(x, y, value);
      }
    }
  }
}

export function fillRect(
  put: Put,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      put(x + dx, y + dy, color);
    }
  }
}

export function thickLine(
  put: Put,
  from: Point,
  to: Point,
  width: number,
  color: string,
) {
  const steps =
    Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) * 2 + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.floor(from[0] + (to[0] - from[0]) * t);
    const y = Math.floor(from[1] + (to[1] - from[1]) * t);
    fillRect(put, x, y, width, width, color);
  }
}

function inPolygon(x: number, y: number, points: Point[]) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      hit = !hit;
    }
  }
  return hit;
}

export function fillPolygon(
  put: Put,
  points: Point[],
  color: (x: number, y: number) => string,
) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inPolygon(x + 0.5, y + 0.5, points)) put(x, y, color(x, y));
    }
  }
}
