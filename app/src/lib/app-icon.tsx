import { ImageResponse } from "next/og";
import {
  composeAppIcon,
  toRuns,
} from "@/features/motivation/utils/slime-sprite";

const FRAME = "#ffd84a";
const PANEL = "#0b0f2a";

type AppIconOptions = {
  size: number;
  framed: boolean;
};

function appIconLayout({ size, framed }: AppIconOptions) {
  const art = composeAppIcon();
  const frame = framed ? Math.max(2, Math.round(size / 16)) : 0;
  const room = framed ? size - frame * 2 : size * 0.6;
  const cell = Math.max(1, Math.floor(room / art.length));
  return { art, cell, frame, artSize: cell * art.length };
}

export function renderAppIcon({ size, framed }: AppIconOptions) {
  const { art, cell, frame, artSize } = appIconLayout({ size, framed });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: framed ? FRAME : PANEL,
        padding: frame,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PANEL,
        }}
      >
        <svg
          aria-hidden="true"
          height={artSize}
          shapeRendering="crispEdges"
          viewBox={`0 0 ${artSize} ${artSize}`}
          width={artSize}
        >
          {toRuns(art).map((run) => (
            <rect
              fill={run.color}
              height={cell}
              key={`${run.x}-${run.y}`}
              width={run.width * cell}
              x={run.x * cell}
              y={run.y * cell}
            />
          ))}
        </svg>
      </div>
    </div>,
    { width: size, height: size },
  );
}
