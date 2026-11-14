"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  buildAmountAxis,
  buildDailyTrend,
  buildProfitSegments,
  compactAmount,
  type DailyTrendPoint,
  isActiveDay,
} from "@/features/ledger/utils/daily-trend";
import { cn } from "@/lib/utils";

const SATURDAY = 6;
const SUNDAY = 0;

function yen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function displayMonth(month: string) {
  const [year, rawMonth] = month.split("-");
  return `${year}年${Number(rawMonth)}月`;
}

function weekdayColor(weekday: number) {
  if (weekday === SATURDAY) {
    return "text-[var(--ledger-saturday)]";
  }

  if (weekday === SUNDAY) {
    return "text-[var(--ledger-sunday)]";
  }

  return "text-muted-foreground";
}

function centerPressedDay(node: HTMLDivElement | null) {
  const pressed = node?.querySelector<HTMLElement>('[aria-pressed="true"]');

  if (!node || !pressed) {
    return;
  }

  node.scrollLeft =
    pressed.offsetLeft - (node.clientWidth - pressed.offsetWidth) / 2;
}

function DayDetail({ point }: { point: DailyTrendPoint }) {
  const active = isActiveDay(point);

  return (
    <div
      aria-live="polite"
      className="border-t border-border bg-[#fffdf7] px-4 py-3"
      data-testid="daily-trend-detail"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-base font-bold">
          {point.label}
          <span
            className={cn(
              "ml-1 font-sans text-xs",
              weekdayColor(point.weekday),
            )}
          >
            ({point.weekdayLabel})
          </span>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground">
          日付をタップで切り替え
        </div>
      </div>
      {active ? (
        <dl className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
              売上
            </dt>
            <dd className="font-mono text-sm font-bold text-[var(--ledger-income)]">
              {yen(point.revenue)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
              事業経費
            </dt>
            <dd className="font-mono text-sm font-bold text-[var(--ledger-expense)]">
              {yen(point.expense)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
              利益
            </dt>
            <dd className="font-mono text-sm font-bold">{yen(point.profit)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          この日の記録はありません
        </p>
      )}
    </div>
  );
}

export function DailyTrendCard({
  month,
  entries,
}: {
  month: string;
  entries: EntriesModel.Item[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const trend = buildDailyTrend(month, entries);
  const activePoints = trend.points.filter(isActiveDay);
  const selectedPoint =
    trend.points.find((point) => point.date === selectedDate) ??
    activePoints.at(-1) ??
    null;
  const axis = buildAmountAxis(
    trend.points.flatMap((point) => [
      point.revenue,
      point.expense,
      point.profit,
    ]),
  );
  const range = axis.max - axis.min;
  const percent = (value: number) => ((value - axis.min) / range) * 100;
  const zeroPercent = percent(0);
  const segments = buildProfitSegments(trend.points);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-bold tracking-[0.2em] text-muted-foreground">
            DAILY TREND
          </div>
          <div className="mt-1 font-serif text-xl font-bold">
            日別収支トレンド
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-[var(--ledger-income)]" />
            売上
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-[var(--ledger-expense)]" />
            事業経費
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
            利益
          </span>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border-border bg-card p-0">
        <div className="grid grid-cols-3 border-b border-border bg-[#fffdf7]">
          <div className="border-r border-border p-3 sm:p-4">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground sm:text-xs">
              最高利益日
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {trend.bestProfitDay?.label ?? "-"}
              {trend.bestProfitDay ? (
                <span className="ml-0.5 font-sans text-[10px] text-muted-foreground sm:text-xs">
                  ({trend.bestProfitDay.weekdayLabel})
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[10px] font-bold text-muted-foreground sm:text-xs">
              {yen(trend.bestProfitDay?.profit ?? 0)}
            </div>
          </div>
          <div className="border-r border-border p-3 sm:p-4">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground sm:text-xs">
              平均利益
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {yen(trend.averageProfit)}
            </div>
            <div className="mt-1 text-[10px] font-bold text-muted-foreground sm:text-xs">
              稼働日の平均
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground sm:text-xs">
              経費率
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {trend.expenseRate}%
            </div>
            <div className="mt-1 text-[10px] font-bold text-muted-foreground sm:text-xs">
              事業経費 ÷ 売上
            </div>
          </div>
        </div>

        {selectedPoint ? (
          <>
            <div className="flex">
              <div aria-hidden="true" className="w-11 shrink-0 pt-4">
                <div className="relative h-48">
                  {axis.ticks.map((tick) => (
                    <span
                      className="absolute right-1.5 translate-y-1/2 font-mono text-[10px] font-bold leading-none text-muted-foreground"
                      key={tick}
                      style={{ bottom: `${percent(tick)}%` }}
                    >
                      {compactAmount(tick)}
                    </span>
                  ))}
                </div>
                <div className="pt-2 pr-1.5 text-right text-[10px] font-bold text-muted-foreground">
                  {Number(month.slice(5))}月
                </div>
              </div>

              <div
                className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain border-l border-border pt-4"
                data-testid="daily-trend-scroll"
                key={month}
                ref={centerPressedDay}
              >
                <fieldset
                  aria-label={`${displayMonth(month)}の日別収支トレンド`}
                  className="relative m-0 flex border-0 p-0"
                  data-testid="daily-trend-chart-area"
                  style={{ minWidth: `${trend.points.length * 2}rem` }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-48"
                  >
                    {axis.ticks.map((tick) => (
                      <div
                        className={cn(
                          "absolute inset-x-0 border-t",
                          tick === 0
                            ? "border-[var(--ledger-soft)]/50"
                            : "border-dashed border-border",
                        )}
                        key={tick}
                        style={{ bottom: `${percent(tick)}%` }}
                      />
                    ))}
                  </div>

                  {trend.points.map((point) => {
                    const selected = point.date === selectedPoint.date;
                    const weekend =
                      point.weekday === SATURDAY || point.weekday === SUNDAY;

                    return (
                      <button
                        aria-label={`${point.label}(${point.weekdayLabel})の収支詳細`}
                        aria-pressed={selected}
                        className={cn(
                          "relative min-w-8 flex-1 basis-0 cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
                          weekend && "bg-foreground/[0.035]",
                          selected && "bg-foreground/[0.09]",
                          point.weekday === 1 &&
                            point.day > 1 &&
                            "border-l border-border",
                        )}
                        key={point.date}
                        onClick={() => setSelectedDate(point.date)}
                        type="button"
                      >
                        <span className="relative block h-48">
                          <span
                            className="absolute inset-x-0 flex items-end justify-center gap-px"
                            style={{
                              bottom: `${zeroPercent}%`,
                              height: `${100 - zeroPercent}%`,
                            }}
                          >
                            {point.revenue > 0 ? (
                              <span
                                className="min-h-0.5 w-2.5 rounded-t-sm bg-[var(--ledger-income)] opacity-85"
                                style={{
                                  height: `${(point.revenue / axis.max) * 100}%`,
                                }}
                              />
                            ) : null}
                            {point.expense > 0 ? (
                              <span
                                className="min-h-0.5 w-1.5 rounded-t-sm bg-[var(--ledger-expense)] opacity-80"
                                style={{
                                  height: `${(point.expense / axis.max) * 100}%`,
                                }}
                              />
                            ) : null}
                          </span>
                        </span>
                        <span className="flex h-12 flex-col items-center gap-1 pt-1.5">
                          <span
                            className={cn(
                              "flex h-5 min-w-5 items-center justify-center rounded-full px-0.5 font-mono text-xs font-bold leading-none",
                              selected
                                ? "bg-foreground text-background"
                                : isActiveDay(point)
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {point.day}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold leading-none",
                              weekdayColor(point.weekday),
                            )}
                          >
                            {point.weekdayLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}

                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-48 w-full"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${trend.points.length} 100`}
                  >
                    {segments.map((segment) => (
                      <line
                        key={segment.from}
                        opacity={segment.bridgesRestDays ? 0.4 : 1}
                        stroke="var(--ledger-ink)"
                        strokeDasharray={
                          segment.bridgesRestDays ? "2 4" : undefined
                        }
                        strokeLinecap="round"
                        strokeWidth={segment.bridgesRestDays ? 1.5 : 2}
                        vectorEffect="non-scaling-stroke"
                        x1={segment.from + 0.5}
                        x2={segment.to + 0.5}
                        y1={100 - percent(trend.points[segment.from].profit)}
                        y2={100 - percent(trend.points[segment.to].profit)}
                      />
                    ))}
                  </svg>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 flex h-48"
                  >
                    {trend.points.map((point) => (
                      <span
                        className="relative min-w-8 flex-1 basis-0"
                        key={point.date}
                      >
                        {isActiveDay(point) ? (
                          <span
                            className={cn(
                              "absolute left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-foreground",
                              point.date === selectedPoint.date
                                ? "bg-foreground"
                                : "bg-[#fffdf7]",
                            )}
                            style={{ bottom: `${percent(point.profit)}%` }}
                          />
                        ) : null}
                      </span>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <DayDetail point={selectedPoint} />
          </>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            この月のトレンドはまだありません
          </div>
        )}
      </Card>
    </section>
  );
}
