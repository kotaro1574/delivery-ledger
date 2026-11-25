import type { RiderStage } from "@/features/motivation/utils/level";
import { cn } from "@/lib/utils";

const INK = "var(--ledger-ink)";
const GOLD = "var(--ledger-gold)";
const PAPER = "var(--ledger-card)";

const stageLabels: Record<RiderStage, string> = {
  rookie: "歩いて配達するルーキー",
  regular: "自転車で配達するレギュラー",
  ace: "電動アシスト自転車で配達するエース",
  veteran: "原付で配達するベテラン",
  legend: "バイクで配達するレジェンド",
};

function Rider({ x, y, lean = 0 }: { x: number; y: number; lean?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean})`}>
      <rect
        fill={GOLD}
        height="20"
        rx="2.5"
        stroke={INK}
        strokeWidth="2.5"
        width="20"
        x="-26"
        y="-6"
      />
      <path d="M-21 3h10" stroke={INK} strokeLinecap="round" strokeWidth="2" />
      <path d="M0 -2v22" stroke={INK} strokeLinecap="round" strokeWidth="5" />
      <circle
        cx="1"
        cy="-12"
        fill={PAPER}
        r="8"
        stroke={INK}
        strokeWidth="2.5"
      />
      <path
        d="M-7.5 -13a8.5 8.5 0 0 1 17 0z"
        fill={INK}
        stroke={INK}
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M9 -13h4" stroke={INK} strokeLinecap="round" strokeWidth="2.5" />
    </g>
  );
}

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} fill="none" r={r} stroke={INK} strokeWidth="3" />
      <circle cx={cx} cy={cy} fill={INK} r="2" />
    </g>
  );
}

function SpeedLines({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={GOLD} strokeLinecap="round" strokeWidth="2.5">
      <path d={`M${x} ${y}h-14`} />
      <path d={`M${x - 4} ${y + 9}h-16`} />
      <path d={`M${x} ${y + 18}h-10`} />
    </g>
  );
}

function Walker() {
  return (
    <g>
      <Rider x={60} y={36} />
      <g fill="none" stroke={INK} strokeLinecap="round" strokeWidth="4">
        <path d="M60 56l-10 28" />
        <path d="M60 56l10 28" />
        <path d="M60 42l12 12" />
      </g>
    </g>
  );
}

function Bicycle({ assist }: { assist: boolean }) {
  return (
    <g>
      {assist ? <SpeedLines x={22} y={44} /> : null}
      <Wheel cx={38} cy={76} r={14} />
      <Wheel cx={92} cy={76} r={14} />
      <g
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      >
        <path d="M38 76l16-24h28l10 24" />
        <path d="M54 52l12 24 16-24" />
        <path d="M82 52l-2-10h8" />
        <path d="M54 52l-2-6" />
      </g>
      {assist ? (
        <rect
          fill={GOLD}
          height="7"
          rx="2"
          stroke={INK}
          strokeWidth="2"
          transform="rotate(62 60 64)"
          width="16"
          x="52"
          y="60"
        />
      ) : null}
      <Rider lean={14} x={58} y={26} />
      <g fill="none" stroke={INK} strokeLinecap="round" strokeWidth="4">
        <path d="M63 46l6 16" />
        <path d="M64 32l20 10" />
      </g>
    </g>
  );
}

function Scooter() {
  return (
    <g>
      <SpeedLines x={20} y={48} />
      <Wheel cx={36} cy={80} r={11} />
      <Wheel cx={94} cy={80} r={11} />
      <path
        d="M26 72c0-10 8-14 18-14h26l8 14h10l6-30h6"
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M30 70h44l-4-12H40c-6 0-10 4-10 12z"
        fill={GOLD}
        stroke={INK}
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <Rider lean={6} x={56} y={26} />
      <g fill="none" stroke={INK} strokeLinecap="round" strokeWidth="4">
        <path d="M57 46l14 10" />
        <path d="M58 32l30 10" />
      </g>
    </g>
  );
}

function Motorbike() {
  return (
    <g>
      <ellipse cx="62" cy="56" fill={GOLD} opacity="0.22" rx="56" ry="40" />
      <g fill={GOLD} stroke={INK} strokeLinejoin="round" strokeWidth="1.5">
        <path d="M14 20l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
        <path d="M108 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </g>
      <SpeedLines x={18} y={50} />
      <Wheel cx={34} cy={78} r={15} />
      <Wheel cx={96} cy={78} r={15} />
      <path
        d="M34 78l14-18h34l14 18M82 60l8-22h8"
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M44 60c4-10 14-12 24-12h12l6 12z"
        fill={GOLD}
        stroke={INK}
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <Rider lean={24} x={58} y={28} />
      <g fill="none" stroke={INK} strokeLinecap="round" strokeWidth="4">
        <path d="M60 48l14 12" />
        <path d="M64 34l28 6" />
      </g>
    </g>
  );
}

export function RiderCharacter({
  stage,
  bounce = false,
  className,
}: {
  stage: RiderStage;
  bounce?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-label={stageLabels[stage]}
      className={cn(
        bounce && "motion-safe:animate-[rider-bounce_0.9s_ease-out_2]",
        className,
      )}
      role="img"
      viewBox="0 0 130 100"
    >
      <path
        d="M6 93h118"
        stroke="var(--ledger-line)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      {stage === "rookie" ? <Walker /> : null}
      {stage === "regular" ? <Bicycle assist={false} /> : null}
      {stage === "ace" ? <Bicycle assist /> : null}
      {stage === "veteran" ? <Scooter /> : null}
      {stage === "legend" ? <Motorbike /> : null}
    </svg>
  );
}
