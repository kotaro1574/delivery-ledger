import { Crown } from "lucide-react";
import type { CSSProperties } from "react";
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
    <section className="overflow-hidden rounded-2xl border border-[var(--ledger-gold)]/35 bg-card shadow-[0_1px_0_rgb(0_0_0_/_4%),0_12px_32px_-18px_rgb(192_138_46_/_45%)]">
      <div className="flex items-center gap-4 p-5">
        <div className="grid size-24 shrink-0 place-items-center rounded-2xl border border-[var(--ledger-gold)]/40 bg-[var(--ledger-gold-soft)] sm:size-28">
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
                <span className="font-mono text-3xl font-bold leading-none">
                  Lv.{level.level}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold tracking-widest",
                    level.tier === 4
                      ? "bg-[var(--ledger-gold)] text-[var(--ledger-ink)]"
                      : "bg-[var(--ledger-ink)] text-[var(--ledger-card)]",
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
              <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-xs font-bold">
                <span className="text-muted-foreground">
                  {yen(revenue)} / {yen(progress.goal)}
                </span>
                <span className="text-[var(--ledger-gold-ink)]">
                  次のLvまで {yen(level.remaining)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold">
                目標を決めるとスライムが生まれる
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                目標の2.5%を稼ぐごとに1レベル。100%でスライムキング
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-[var(--ledger-gold)]/35 bg-[#fffdf7] px-5 py-3">
        {progress ? (
          <>
            <div className="min-w-0">
              <div className="text-xs tracking-widest text-muted-foreground">
                {monthNumber}月の目標 {yen(progress.goal)}
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
                  ? "今月の目標を決めよう"
                  : `${monthNumber}月の目標を決める`
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
    </section>
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
      <div
        aria-label={`今月の目標達成率${Math.floor(progress.rate * 100)}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.floor(progress.rate * 100)}
        className="relative h-3 flex-1 overflow-hidden rounded-full bg-[var(--ledger-gold-soft)] ring-1 ring-[var(--ledger-gold)]/30"
        role="progressbar"
      >
        <div
          className={cn(
            "h-full rounded-full",
            progress.achieved
              ? "bg-[var(--ledger-income)]"
              : "bg-[var(--ledger-gold)]",
            celebrating &&
              "motion-safe:animate-[xp-fill_1.4s_cubic-bezier(0.2,0.8,0.2,1)_0.3s_both]",
          )}
          style={style}
        />
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
          <span className="border-r border-white/70" />
          <span className="border-r border-white/70" />
          <span className="border-r border-white/70" />
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
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ledger-gold-soft)] px-2.5 py-1 text-xs font-bold text-[var(--ledger-gold-ink)] ring-1 ring-[var(--ledger-gold)]/40">
      <Crown className="size-3.5" />
      キング達成 {count}回
    </span>
  );
}

function GoalStatus({ progress }: { progress: GoalProgress }) {
  if (progress.achieved) {
    return (
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm font-bold text-[var(--ledger-income)]">
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
      <div className="mt-0.5 text-xs font-bold text-muted-foreground">
        未達 あと {yen(progress.remaining)} だった
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-bold">
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
