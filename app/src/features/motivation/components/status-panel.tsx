import { Crown } from "lucide-react";
import type { CSSProperties } from "react";
import { GameWindow } from "@/components/game/game-window";
import { GoalEditor } from "@/features/motivation/components/goal-editor";
import { SlimeCharacter } from "@/features/motivation/components/slime-character";
import {
  type GoalProgress,
  goalProgress,
  goalTiming,
} from "@/features/motivation/utils/goal-progress";
import { monthlyLevel } from "@/features/motivation/utils/monthly-level";
import { yen } from "@/features/motivation/utils/yen";
import { cn } from "@/lib/utils";

type BarStyle = CSSProperties & { "--xp-from": string; "--xp-to": string };

function percent(rate: number) {
  return `${Math.round(Math.min(1, rate) * 1000) / 10}%`;
}

export function StatusPanel({
  month,
  revenue,
  goal,
  kingMonths,
  today,
  highlightFrom,
}: {
  month: string;
  revenue: number;
  goal: number | null;
  kingMonths: number;
  today: Date;
  highlightFrom?: number;
}) {
  const level = monthlyLevel(revenue, goal);
  const progress = goalProgress({ month, revenue, goal, today });
  const celebrating = highlightFrom !== undefined;
  const monthNumber = Number(month.slice(5));

  return (
    <GameWindow className="p-0 pt-0 pb-0" title="ステータス">
      <div className="flex items-center gap-4 px-4 pt-5 pb-4">
        <div className="grid size-24 shrink-0 place-items-center rounded-[4px] border-2 border-[var(--game-line)]/40 bg-[var(--game-panel)] sm:size-28">
          <SlimeCharacter
            bounce={celebrating}
            className="size-[88%]"
            level={level}
          />
        </div>
        <div className="min-w-0 flex-1">
          {level && progress ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl leading-none text-[var(--game-gold)]">
                  Lv.{level.level}
                </span>
                <span
                  className={cn(
                    "rounded-[2px] border-2 px-2 py-0.5 text-xs tracking-widest",
                    level.tier === 4
                      ? "border-[var(--game-gold)] bg-[var(--game-gold)] text-[var(--game-bg)]"
                      : "border-[var(--game-line)] text-[var(--game-line)]",
                  )}
                >
                  {level.title}
                </span>
              </div>
              <AchievementBar
                celebrating={celebrating}
                fromRate={
                  highlightFrom !== undefined && goal
                    ? highlightFrom / goal
                    : progress.rate
                }
                progress={progress}
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 whitespace-nowrap text-xs">
                <span className="font-mono text-[var(--game-income)]">
                  かせいだ {yen(revenue)}
                </span>
                <span className="font-mono text-[var(--game-gold)]">
                  つぎのレベルまで {yen(level.remaining)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm">
                もくひょうを きめると スライムが うまれる
              </div>
              <div className="mt-1 text-xs text-[var(--game-sub)]">
                もくひょうの 2.5% を かせぐごとに 1レベル。100% で
                スライムキング
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-[var(--game-line)]/40 px-4 py-3">
        {progress ? (
          <>
            <div className="min-w-0">
              <div className="font-mono text-xs tracking-widest text-[var(--game-sub)]">
                {monthNumber}月の もくひょう {yen(progress.goal)}
              </div>
              <GoalStatus progress={progress} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {kingMonths > 0 ? <KingBadge count={kingMonths} /> : null}
              <GoalEditor emptyLabel="" goal={goal} month={month} />
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <GoalEditor
              emptyLabel={
                goalTiming(month, today) === "current"
                  ? "こんげつの もくひょうを きめよう"
                  : `${monthNumber}月の もくひょうを きめる`
              }
              goal={null}
              month={month}
            />
            {kingMonths > 0 ? (
              <div className="self-end">
                <KingBadge count={kingMonths} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </GameWindow>
  );
}

function AchievementBar({
  progress,
  fromRate,
  celebrating,
}: {
  progress: GoalProgress;
  fromRate: number;
  celebrating: boolean;
}) {
  const to = percent(progress.rate);
  const style: BarStyle = {
    width: to,
    "--xp-from": percent(Math.max(0, fromRate)),
    "--xp-to": to,
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-xs text-[var(--game-sub)]">EXP</span>
      <div
        aria-label={`今月の目標達成率${Math.floor(progress.rate * 100)}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.floor(progress.rate * 100)}
        className="relative h-3.5 flex-1 overflow-hidden border-2 border-[var(--game-line)] bg-[var(--game-panel)]"
        role="progressbar"
      >
        <div
          className={cn(
            "h-full",
            progress.achieved
              ? "bg-[var(--game-income)]"
              : "bg-[var(--game-gold)]",
            celebrating &&
              "motion-safe:animate-[xp-fill_1.4s_steps(12,end)_0.3s_both]",
          )}
          style={style}
        />
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
          <span className="border-r-2 border-[var(--game-bg)]/60" />
          <span className="border-r-2 border-[var(--game-bg)]/60" />
          <span className="border-r-2 border-[var(--game-bg)]/60" />
          <span />
        </div>
      </div>
      <span className="font-mono text-sm font-bold">
        {Math.floor(progress.rate * 100)}%
      </span>
    </div>
  );
}

function KingBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] border-2 border-[var(--game-gold)] px-2 py-1 text-xs text-[var(--game-gold)]">
      <Crown className="size-3.5" />
      キング {count}回
    </span>
  );
}

function GoalStatus({ progress }: { progress: GoalProgress }) {
  if (progress.achieved) {
    return (
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-[var(--game-income)]">
        <span>もくひょう たっせい！</span>
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
      <div className="mt-0.5 font-mono text-xs text-[var(--game-sub)]">
        あと {yen(progress.remaining)} たりなかった
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-xs">
      <span className="text-[var(--game-sub)]">
        あと {yen(progress.remaining)}
      </span>
      {progress.dailyPace !== null ? (
        <span className="text-[var(--game-gold)]">
          1にち {yen(progress.dailyPace)} ペース
        </span>
      ) : null}
    </div>
  );
}
