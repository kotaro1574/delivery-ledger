"use client";

import { Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { levelFromRevenue } from "@/features/motivation/utils/level";
import { yen } from "@/features/motivation/utils/yen";
import { cn } from "@/lib/utils";

export function CelebrationBanner({
  gained,
  lifetimeRevenue,
  month,
}: {
  gained: number;
  lifetimeRevenue: number;
  month: string;
}) {
  const router = useRouter();
  const before = levelFromRevenue(lifetimeRevenue - gained);
  const after = levelFromRevenue(lifetimeRevenue);
  const leveledUp = after.level > before.level;
  const evolved = after.stage !== before.stage;

  return (
    <section
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-4 pr-12 motion-safe:animate-[celebrate-pop_0.5s_ease-out_both]",
        leveledUp
          ? "border-[var(--ledger-gold)] bg-[var(--ledger-ink)] text-[var(--ledger-card)]"
          : "border-[var(--ledger-income)]/40 bg-[#eef4ee] text-[var(--ledger-income)]",
      )}
    >
      <div className="flex items-center gap-3">
        <Sparkles
          className={cn(
            "size-6 shrink-0",
            leveledUp
              ? "text-[var(--ledger-gold)] motion-safe:animate-pulse"
              : "text-[var(--ledger-income)]",
          )}
        />
        <div className="min-w-0">
          <div className="font-mono text-xl font-bold">
            +{yen(gained)} ゲット！
          </div>
          {leveledUp ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-sm font-bold tracking-[0.2em] text-[var(--ledger-gold)]">
                LEVEL UP!
              </span>
              <span className="font-mono text-sm font-bold">
                Lv.{before.level} → Lv.{after.level}
              </span>
              {evolved ? (
                <span className="rounded-full bg-[var(--ledger-gold)] px-2 py-0.5 text-xs font-bold text-[var(--ledger-ink)]">
                  {after.title}に進化！
                </span>
              ) : null}
            </div>
          ) : (
            <div className="mt-0.5 text-xs font-bold opacity-80">
              次のLvまで あと {yen(after.remaining)}
            </div>
          )}
        </div>
      </div>
      <button
        aria-label="閉じる"
        className={cn(
          "absolute top-3 right-3 grid size-8 place-items-center rounded-lg transition",
          leveledUp ? "hover:bg-white/10" : "hover:bg-black/5",
        )}
        onClick={() => router.replace(`/?month=${month}`, { scroll: false })}
        type="button"
      >
        <X className="size-4" />
      </button>
    </section>
  );
}
