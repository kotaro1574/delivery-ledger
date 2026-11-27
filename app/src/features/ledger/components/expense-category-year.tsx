import { summarizeCategoryYear } from "@server/modules/entries/category-year";
import type { EntriesModel } from "@server/modules/entries/model";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GameWindow } from "@/components/game/game-window";
import { expenseCategories } from "@/features/entries/utils/journal-preview";
import { EntryLedger } from "@/features/ledger/components/entry-ledger";
import { yen } from "@/features/motivation/utils/yen";
import { cn } from "@/lib/utils";

const YEAR_LINK =
  "grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]";

function expensesHref(year: number | string, categoryCode: string) {
  return `/year/expenses?year=${year}&category=${categoryCode}`;
}

export function ExpenseCategoryYear({
  year,
  categoryCode,
  entries,
}: {
  year: string;
  categoryCode: string;
  entries: EntriesModel.Item[];
}) {
  const category =
    expenseCategories.find((item) => item.code === categoryCode) ??
    expenseCategories[0];
  const summary = summarizeCategoryYear(entries);
  const peak = Math.max(1, ...summary.months);
  const months = summary.months.map((amount, index) => ({
    month: index + 1,
    amount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-lg tracking-widest">{year}年の けいひ</div>
        <div className="flex items-center gap-3">
          <Link
            aria-label="まえの とし"
            className={YEAR_LINK}
            href={expensesHref(Number(year) - 1, category.code)}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            aria-label="つぎの とし"
            className={YEAR_LINK}
            href={expensesHref(Number(year) + 1, category.code)}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <nav
        aria-label="かもく"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {expenseCategories.map((item) => {
          const active = item.code === category.code;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1 rounded-[4px] border-2 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]",
                active
                  ? "border-[var(--game-gold)] text-[var(--game-gold)]"
                  : "border-[var(--game-line)]/60 text-[var(--game-line)] hover:text-[var(--game-gold)]",
              )}
              href={expensesHref(year, item.code)}
              key={item.code}
            >
              {active ? (
                <span aria-hidden="true" className="text-xs">
                  ▶
                </span>
              ) : null}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <GameWindow title={`${category.name}の ごうけい`}>
        <div className="text-xs tracking-widest text-[var(--game-sub)]">
          事業分
        </div>
        <div className="font-mono text-3xl font-bold text-[var(--game-expense)]">
          {yen(summary.business)}
        </div>
        <div className="mt-1 font-mono text-xs text-[var(--game-sub)]">
          {`しはらい ${yen(summary.paid)}`}
        </div>
      </GameWindow>

      <GameWindow title="つきごと">
        <div className="grid h-28 grid-cols-12 items-end gap-1">
          {months.map(({ month, amount }) => (
            <div
              className="flex h-full flex-col items-center justify-end gap-1"
              key={month}
            >
              <div
                aria-label={`${month}月 ${yen(amount)}`}
                className={cn(
                  "w-full max-w-4",
                  amount > 0
                    ? "bg-[var(--game-expense)]"
                    : "bg-[var(--game-line)]/20",
                )}
                role="img"
                style={{
                  height: amount > 0 ? `${(amount / peak) * 100}%` : "2px",
                }}
              />
              <span className="font-mono text-xs text-[var(--game-sub)]">
                {month}
              </span>
            </div>
          ))}
        </div>
      </GameWindow>

      <EntryLedger
        emptyText={`この としの ${category.name}は まだ ない`}
        entries={entries}
        title={`めいさい（${entries.length}けん）`}
      />
    </div>
  );
}
