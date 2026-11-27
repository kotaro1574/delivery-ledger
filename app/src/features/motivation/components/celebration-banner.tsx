"use client";

import { useRouter } from "next/navigation";
import {
  KING_LEVEL,
  monthlyLevel,
} from "@/features/motivation/utils/monthly-level";
import { yen } from "@/features/motivation/utils/yen";
import { cn } from "@/lib/utils";

export function CelebrationBanner({
  gained,
  revenue,
  goal,
  month,
}: {
  gained: number;
  revenue: number;
  goal: number | null;
  month: string;
}) {
  const router = useRouter();
  const before = monthlyLevel(revenue - gained, goal);
  const after = monthlyLevel(revenue, goal);
  const leveledUp = before && after ? after.level > before.level : false;
  const becameKing =
    before && after
      ? before.level < KING_LEVEL && after.level >= KING_LEVEL
      : false;
  const evolved =
    before && after ? !becameKing && after.tier !== before.tier : false;

  return (
    <section
      aria-live="polite"
      className={cn(
        "relative rounded-[4px] border-[3px] bg-[var(--game-bg)] p-4 pr-12 shadow-[0_0_0_3px_var(--game-bg)] motion-safe:animate-[celebrate-pop_0.5s_steps(4,end)_both]",
        leveledUp ? "border-[var(--game-gold)]" : "border-[var(--game-line)]",
      )}
    >
      <div className="space-y-1 leading-relaxed">
        <div className="font-mono text-xl text-[var(--game-income)]">
          +{yen(gained)} ゲット！
        </div>
        {after && leveledUp ? (
          <div className="text-[var(--game-gold)]">
            スライムは レベル{after.level}に あがった！
          </div>
        ) : null}
        {becameKing ? (
          <div className="text-[var(--game-gold)]">
            もくひょうたっせい！ スライムキングが たんじょうした！
          </div>
        ) : null}
        {after && evolved ? (
          <div className="text-[var(--game-gold)]">
            {after.title}に しんかした！
          </div>
        ) : null}
        {after && !leveledUp ? (
          <div className="font-mono text-sm text-[var(--game-sub)]">
            つぎのレベルまで あと {yen(after.remaining)}
          </div>
        ) : null}
      </div>
      <span
        aria-hidden="true"
        className="absolute right-4 bottom-2 text-xs text-[var(--game-line)] motion-safe:animate-[cursor-blink_1s_steps(2,jump-none)_infinite]"
      >
        ▼
      </span>
      <button
        aria-label="とじる"
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-[2px] text-[var(--game-line)] hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
        onClick={() => router.replace(`/?month=${month}`, { scroll: false })}
        type="button"
      >
        ×
      </button>
    </section>
  );
}
