import { ImageResponse } from "next/og";

const APP_ICON_BACKGROUND = "#22201a";
const APP_ICON_FOREGROUND = "#fbf9f3";

type AppIconOptions = {
  size: number;
  glyphRatio: number;
  cornerRatio: number;
};

export function renderAppIcon({
  size,
  glyphRatio,
  cornerRatio,
}: AppIconOptions) {
  const glyph = Math.round(size * glyphRatio);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: APP_ICON_BACKGROUND,
        borderRadius: Math.round(size * cornerRatio),
      }}
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill={APP_ICON_FOREGROUND}
        aria-hidden="true"
      >
        <path d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.63 0-3-1.37-3-3s1.37-3 3-3 3 1.37 3 3-1.37 3-3 3z" />
      </svg>
    </div>,
    { width: size, height: size },
  );
}
