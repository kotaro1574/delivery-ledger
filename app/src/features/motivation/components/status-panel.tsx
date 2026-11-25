import { GoalCard } from "@/features/motivation/components/goal-card";
import { LevelCard } from "@/features/motivation/components/level-card";

export function StatusPanel({
  month,
  revenue,
  lifetimeRevenue,
  goal,
  today,
  highlightFrom,
}: {
  month: string;
  revenue: number;
  lifetimeRevenue: number;
  goal: number | null;
  today: Date;
  highlightFrom?: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--ledger-gold)]/35 bg-card shadow-[0_1px_0_rgb(0_0_0_/_4%),0_12px_32px_-18px_rgb(192_138_46_/_45%)]">
      <div className="p-5">
        <LevelCard
          highlightFrom={highlightFrom}
          lifetimeRevenue={lifetimeRevenue}
        />
      </div>
      <div className="border-t border-dashed border-[var(--ledger-gold)]/35 bg-[#fffdf7] p-5">
        <GoalCard goal={goal} month={month} revenue={revenue} today={today} />
      </div>
    </section>
  );
}
