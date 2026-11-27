"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import type { SummaryModel } from "@server/modules/summary/model";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GameWindow } from "@/components/game/game-window";
import { DailyTrendCard } from "@/features/ledger/components/daily-trend-card";
import { EntryLedger } from "@/features/ledger/components/entry-ledger";
import { CelebrationBanner } from "@/features/motivation/components/celebration-banner";
import { StatusPanel } from "@/features/motivation/components/status-panel";
import { yen } from "@/features/motivation/utils/yen";
import { parseDateString } from "@/lib/date";

function displayMonth(month: string) {
  const [year, rawMonth] = month.split("-");
  return `${year}年${Number(rawMonth)}月`;
}

function moveMonth(month: string, offset: number) {
  const [year, rawMonth] = month.split("-").map(Number);
  const date = new Date(year, rawMonth - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function LedgerDashboard({
  month,
  summary,
  entries,
  gained,
  today,
}: {
  month: string;
  today: string;
  summary: SummaryModel.Response;
  entries: EntriesModel.Item[];
  gained?: number;
}) {
  const maxCategory = Math.max(
    1,
    ...summary.byCategory.map((item) => item.amount),
  );
  const privateExpense = Math.max(0, summary.paidExpense - summary.expense);
  const showExpenseBreakdown = summary.paidExpense > 0 && privateExpense > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm tracking-[0.2em] text-[var(--game-sub)]">
          つきの きろく
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/?month=${moveMonth(month, -1)}`}
            aria-label="まえの つき"
            className="grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-28 text-center font-mono text-base font-bold text-[var(--game-gold)]">
            {displayMonth(month)}
          </div>
          <Link
            href={`/?month=${moveMonth(month, 1)}`}
            aria-label="つぎの つき"
            className="grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {gained !== undefined ? (
        <CelebrationBanner
          gained={gained}
          goal={summary.goal}
          month={month}
          revenue={summary.revenue}
        />
      ) : null}

      <StatusPanel
        goal={summary.goal}
        highlightFrom={
          gained !== undefined ? summary.revenue - gained : undefined
        }
        kingMonths={summary.kingMonths}
        month={month}
        revenue={summary.revenue}
        today={parseDateString(today)}
      />

      <GameWindow className="grid gap-4 sm:grid-cols-3" title="しゅうし">
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            うりあげ
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--game-income)]">
            {yen(summary.revenue)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            経費（事業分）
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--game-expense)]">
            {yen(summary.expense)}
          </div>
          {showExpenseBreakdown ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--game-sub)]">
              <span>支払総額 {yen(summary.paidExpense)}</span>
              <span>私用分 {yen(privateExpense)}</span>
            </div>
          ) : null}
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            差引利益
          </div>
          <div className="font-mono text-3xl font-bold text-[var(--game-gold)]">
            {yen(summary.profit)}
          </div>
        </div>
      </GameWindow>

      <DailyTrendCard
        entries={entries}
        month={month}
        stats={summary.dailyStats}
      />

      <GameWindow className="px-0 pb-1" title="経費内訳（事業分）">
        <div>
          {summary.byCategory.length > 0 ? (
            summary.byCategory.map((item) => (
              <div
                className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 border-b-2 border-dashed border-[var(--game-line)]/25 px-4 py-3 last:border-b-0"
                key={item.code}
              >
                <span className="text-sm">{item.name}</span>
                <span className="relative h-2.5 overflow-hidden border border-[var(--game-line)]/60 bg-[var(--game-panel)]">
                  <span
                    className="absolute inset-y-0 left-0 bg-[var(--game-expense)]"
                    style={{ width: `${(item.amount / maxCategory) * 100}%` }}
                  />
                </span>
                <span className="font-mono text-sm font-bold text-[var(--game-expense)]">
                  {yen(item.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--game-sub)]">
              この つきの けいひは まだ ない
            </div>
          )}
        </div>
      </GameWindow>

      <GameWindow className="grid grid-cols-2 gap-4" title="つよさ">
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            じきゅう
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.wagePerHour)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            1けん あたり
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.perDelivery)}
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--game-sub)]">
            {summary.metrics.deliveries}件
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            はたらいた ひかず
          </div>
          <div className="font-mono text-2xl font-bold">
            {summary.metrics.workDays}日
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            はたらいた じかん
          </div>
          <div className="font-mono text-2xl font-bold">
            {summary.metrics.onlineHours}時間
          </div>
        </div>
      </GameWindow>

      <EntryLedger
        emptyText="この つきの とりひきは まだ ない"
        entries={entries}
        title="まいにちの とりひき"
      />
    </div>
  );
}
