export type BodyPalette = {
  hi: string;
  base: string;
  mid: string;
  dark: string;
  spec: string;
};

type Hsl = [hue: number, saturation: number, lightness: number];

const KING_PALETTE: BodyPalette = {
  hi: "#fff6c8",
  base: "#ffd24a",
  mid: "#e8a630",
  dark: "#b07420",
  spec: "#fffdf0",
};

const ANCHORS: readonly [level: number, palette: BodyPalette][] = [
  [
    1,
    {
      hi: "#d8f7b8",
      base: "#7fd36a",
      mid: "#4fa84a",
      dark: "#2f7a3c",
      spec: "#f4ffe8",
    },
  ],
  [
    11,
    {
      hi: "#d0efff",
      base: "#62b8f0",
      mid: "#3a86c8",
      dark: "#265e9e",
      spec: "#f0fbff",
    },
  ],
  [
    21,
    {
      hi: "#ecdcff",
      base: "#a87ce8",
      mid: "#7c52c4",
      dark: "#56369a",
      spec: "#fbf5ff",
    },
  ],
  [
    31,
    {
      hi: "#ffd0b8",
      base: "#ff7a4a",
      mid: "#d8522c",
      dark: "#9a3420",
      spec: "#fff3ec",
    },
  ],
  [
    40,
    {
      hi: "#ffe6b0",
      base: "#ffb04a",
      mid: "#e0842c",
      dark: "#a85a1e",
      spec: "#fff8ea",
    },
  ],
];

function toHsl(color: string): Hsl {
  const [r, g, b] = [1, 3, 5].map(
    (k) => Number.parseInt(color.slice(k, k + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return [hue * 60, saturation, lightness];
}

function fromHsl([hue, saturation, lightness]: Hsl) {
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function mixHue(from: string, to: string, t: number) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const [h1, s1, l1] = toHsl(from);
  const [h2, s2, l2] = toHsl(to);
  let delta = h2 - h1;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return fromHsl([
    (h1 + delta * t + 360) % 360,
    lerp(s1, s2, t),
    lerp(l1, l2, t),
  ]);
}

export function bodyPalette(level: number): BodyPalette {
  if (level >= 41) return KING_PALETTE;
  const index = ANCHORS.findIndex(
    ([from], i) => level >= from && level < (ANCHORS[i + 1]?.[0] ?? 41),
  );
  const [fromLevel, from] = ANCHORS[Math.max(0, index)];
  const next = ANCHORS[index + 1];
  if (!next) return from;
  const [toLevel, to] = next;
  const t = (level - fromLevel) / (toLevel - fromLevel);
  return {
    hi: mixHue(from.hi, to.hi, t),
    base: mixHue(from.base, to.base, t),
    mid: mixHue(from.mid, to.mid, t),
    dark: mixHue(from.dark, to.dark, t),
    spec: mixHue(from.spec, to.spec, t),
  };
}
