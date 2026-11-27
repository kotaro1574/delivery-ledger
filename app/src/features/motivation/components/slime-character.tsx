import type { MonthlyLevel } from "@/features/motivation/utils/monthly-level";
import {
  composeEgg,
  composeSlime,
  toRuns,
} from "@/features/motivation/utils/slime-sprite";
import { cn } from "@/lib/utils";

export function SlimeCharacter({
  level,
  bounce = false,
  className,
}: {
  level: MonthlyLevel | null;
  bounce?: boolean;
  className?: string;
}) {
  const grid = level
    ? composeSlime({ tier: level.tier, step: level.step, gems: level.gems })
        .grid
    : composeEgg();
  const label = level
    ? `Lv.${level.level} ${level.title}の はいたつスライム`
    : "スライムのたまご";

  return (
    <svg
      aria-label={label}
      className={cn(
        "motion-safe:animate-[slime-bob_1.2s_steps(2,jump-none)_infinite]",
        bounce && "motion-safe:animate-[rider-bounce_0.9s_ease-out_2]",
        className,
      )}
      role="img"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
    >
      {toRuns(grid).map((run) => (
        <rect
          fill={run.color}
          height="1"
          key={`${run.x}-${run.y}`}
          width={run.width}
          x={run.x}
          y={run.y}
        />
      ))}
    </svg>
  );
}
