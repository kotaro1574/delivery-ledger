import { GoalEditor } from "@/features/motivation/components/goal-editor";
import {
  type GoalProgress,
  goalProgress,
  goalTiming,
} from "@/features/motivation/utils/goal-progress";
import { yen } from "@/features/motivation/utils/yen";

const RING_RADIUS = 30;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ rate, achieved }: { rate: number; achieved: boolean }) {
  return (
    <div className="relative size-20 shrink-0">
      <svg
        aria-hidden="true"
        className="size-full -rotate-90"
        viewBox="0 0 72 72"
      >
        <circle
          cx="36"
          cy="36"
          fill="none"
          r={RING_RADIUS}
          stroke="var(--ledger-gold-soft)"
          strokeWidth="8"
        />
        <circle
          cx="36"
          cy="36"
          fill="none"
          r={RING_RADIUS}
          stroke={achieved ? "var(--ledger-income)" : "var(--ledger-gold)"}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - rate)}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-base font-bold">
        {Math.floor(rate * 100)}%
      </div>
    </div>
  );
}

export function GoalCard({
  month,
  revenue,
  goal,
  today,
}: {
  month: string;
  revenue: number;
  goal: number | null;
  today: Date;
}) {
  const progress = goalProgress({ month, revenue, goal, today });
  const monthNumber = Number(month.slice(5));

  if (!progress) {
    return (
      <GoalEditor
        emptyLabel={
          goalTiming(month, today) === "current"
            ? "今月の目標を決めよう"
            : `${monthNumber}月の目標を決める`
        }
        goal={null}
        month={month}
      />
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ProgressRing achieved={progress.achieved} rate={progress.rate} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs tracking-widest text-muted-foreground">
              {monthNumber}月の目標
            </div>
            <div className="font-mono text-lg font-bold">
              {yen(progress.goal)}
            </div>
          </div>
          <GoalEditor emptyLabel="" goal={goal} month={month} />
        </div>
        <div className="mt-1 text-sm">
          <span className="font-mono font-bold text-[var(--ledger-income)]">
            {yen(revenue)}
          </span>{" "}
          <span className="text-muted-foreground">稼いだ</span>
        </div>
        <GoalStatus progress={progress} />
      </div>
    </div>
  );
}

function GoalStatus({ progress }: { progress: GoalProgress }) {
  if (progress.achieved) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm font-bold text-[var(--ledger-income)]">
        <span>目標達成！</span>
        {progress.overAmount > 0 ? (
          <span className="font-mono text-xs">
            +{yen(progress.overAmount)} オーバー
          </span>
        ) : null}
      </div>
    );
  }

  if (progress.timing === "past") {
    return (
      <div className="mt-1 text-xs font-bold text-muted-foreground">
        未達 あと {yen(progress.remaining)} だった
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap gap-x-3 text-xs font-bold">
      <span className="text-muted-foreground">
        あと {yen(progress.remaining)}
      </span>
      {progress.dailyPace !== null ? (
        <span className="text-[var(--ledger-gold-ink)]">
          1日 {yen(progress.dailyPace)} ペース
        </span>
      ) : null}
    </div>
  );
}
