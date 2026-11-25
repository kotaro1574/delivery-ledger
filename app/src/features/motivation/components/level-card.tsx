import type { CSSProperties } from "react";
import { RiderCharacter } from "@/features/motivation/components/rider-character";
import { levelFromRevenue } from "@/features/motivation/utils/level";
import { yen } from "@/features/motivation/utils/yen";
import { cn } from "@/lib/utils";

type XpStyle = CSSProperties & { "--xp-from": string; "--xp-to": string };

export function LevelCard({
  lifetimeRevenue,
  highlightFrom,
}: {
  lifetimeRevenue: number;
  highlightFrom?: number;
}) {
  const info = levelFromRevenue(lifetimeRevenue);
  const celebrating = highlightFrom !== undefined;
  const before =
    highlightFrom !== undefined ? levelFromRevenue(highlightFrom) : null;
  const fromProgress =
    before && before.level === info.level ? before.progress : 0;
  const toPercent = `${Math.round(info.progress * 1000) / 10}%`;
  const barStyle: XpStyle = {
    width: toPercent,
    "--xp-from": `${Math.round(fromProgress * 1000) / 10}%`,
    "--xp-to": toPercent,
  };

  return (
    <div className="flex items-center gap-4">
      <div className="grid size-24 shrink-0 place-items-center rounded-2xl border border-[var(--ledger-gold)]/40 bg-[var(--ledger-gold-soft)] sm:size-28">
        <RiderCharacter
          bounce={celebrating}
          className="w-[88%]"
          stage={info.stage}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-mono text-3xl font-bold leading-none">
            Lv.{info.level}
          </span>
          <span className="rounded-full bg-[var(--ledger-ink)] px-2.5 py-0.5 text-xs font-bold tracking-widest text-[var(--ledger-card)]">
            {info.title}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          累計売上{" "}
          <span className="font-mono font-bold text-foreground">
            {yen(lifetimeRevenue)}
          </span>
        </div>
        <div
          aria-label={`次のレベルまで${Math.round(info.progress * 100)}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(info.progress * 100)}
          className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--ledger-gold-soft)] ring-1 ring-[var(--ledger-gold)]/30"
          role="progressbar"
        >
          <div
            className={cn(
              "h-full rounded-full bg-[var(--ledger-gold)]",
              celebrating &&
                "motion-safe:animate-[xp-fill_1.4s_cubic-bezier(0.2,0.8,0.2,1)_0.3s_both]",
            )}
            style={barStyle}
          />
        </div>
        <div className="mt-1.5 text-right font-mono text-xs font-bold text-[var(--ledger-gold-ink)]">
          次のLvまで {yen(info.remaining)}
        </div>
      </div>
    </div>
  );
}
