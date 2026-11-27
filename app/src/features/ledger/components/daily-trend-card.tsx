"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import { useState } from "react";
import { GameWindow } from "@/components/game/game-window";
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
    return "text-[var(--game-saturday)]";
  }

  if (weekday === SUNDAY) {
    return "text-[var(--game-sunday)]";
  }

  return "text-[var(--game-sub)]";
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
      className="border-t-2 border-dashed border-[var(--game-line)]/40 px-4 py-3"
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
        <div className="text-xs text-[var(--game-sub)]">
          ひづけを タップで きりかえ
        </div>
      </div>
      {active ? (
        <dl className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <dt className="text-xs tracking-widest text-[var(--game-sub)]">
              うりあげ
            </dt>
            <dd className="font-mono text-sm font-bold text-[var(--game-income)]">
              {yen(point.revenue)}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-widest text-[var(--game-sub)]">
              事業経費
            </dt>
            <dd className="font-mono text-sm font-bold text-[var(--game-expense)]">
              {yen(point.expense)}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-widest text-[var(--game-sub)]">
              利益
            </dt>
            <dd className="font-mono text-sm font-bold">{yen(point.profit)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-[var(--game-sub)]">
          この ひの きろくは ない
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
    <GameWindow className="px-0 pb-0" title="ひごとの しゅうし">
      <div className="flex flex-wrap justify-end gap-3 px-4 pb-2 text-xs text-[var(--game-sub)]">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 bg-[var(--game-income)]" />
          うりあげ
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 bg-[var(--game-expense)]" />
          事業経費
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 bg-[var(--game-gold)]" />
          利益
        </span>
      </div>

      <div>
        <div className="grid grid-cols-3 border-y-2 border-dashed border-[var(--game-line)]/40">
          <div className="border-r-2 border-dashed border-[var(--game-line)]/40 p-3 sm:p-4">
            <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
              最高利益日
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {trend.bestProfitDay?.label ?? "-"}
              {trend.bestProfitDay ? (
                <span className="ml-0.5 text-xs text-[var(--game-sub)]">
                  ({trend.bestProfitDay.weekdayLabel})
                </span>
              ) : null}
            </div>
            <div className="mt-1 font-mono text-xs text-[var(--game-sub)]">
              {yen(trend.bestProfitDay?.profit ?? 0)}
            </div>
          </div>
          <div className="border-r-2 border-dashed border-[var(--game-line)]/40 p-3 sm:p-4">
            <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
              平均利益
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {yen(trend.averageProfit)}
            </div>
            <div className="mt-1 font-mono text-xs text-[var(--game-sub)]">
              はたらいた ひの へいきん
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
              経費率
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {trend.expenseRate}%
            </div>
            <div className="mt-1 font-mono text-xs text-[var(--game-sub)]">
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
                      className="absolute right-1.5 translate-y-1/2 font-mono text-[10px] font-bold leading-none text-[var(--game-sub)]"
                      key={tick}
                      style={{ bottom: `${percent(tick)}%` }}
                    >
                      {compactAmount(tick)}
                    </span>
                  ))}
                </div>
                <div className="pt-2 pr-1.5 text-right font-mono text-[10px] font-bold text-[var(--game-sub)]">
                  {Number(month.slice(5))}月
                </div>
              </div>

              <div
                className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain border-l-2 border-[var(--game-line)]/40 pt-4"
                data-testid="daily-trend-scroll"
                key={month}
                ref={centerPressedDay}
              >
                <fieldset
                  aria-label={`${displayMonth(month)}の ひごとの しゅうし`}
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
                            ? "border-[var(--game-line)]/60"
                            : "border-dashed border-[var(--game-line)]/20",
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
                          "relative min-w-8 flex-1 basis-0 cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--game-gold)]",
                          weekend && "bg-white/[0.04]",
                          selected && "bg-white/[0.12]",
                          point.weekday === 1 &&
                            point.day > 1 &&
                            "border-l border-[var(--game-line)]/20",
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
                                className="min-h-0.5 w-2.5 bg-[var(--game-income)]"
                                style={{
                                  height: `${(point.revenue / axis.max) * 100}%`,
                                }}
                              />
                            ) : null}
                            {point.expense > 0 ? (
                              <span
                                className="min-h-0.5 w-1.5 bg-[var(--game-expense)]"
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
                              "flex h-5 min-w-5 items-center justify-center rounded-[2px] px-0.5 font-mono text-xs font-bold leading-none",
                              selected
                                ? "bg-[var(--game-gold)] text-[var(--game-bg)]"
                                : isActiveDay(point)
                                  ? "text-foreground"
                                  : "text-[var(--game-sub)]/60",
                            )}
                          >
                            {point.day}
                          </span>
                          <span
                            className={cn(
                              "text-xs leading-none",
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
                        stroke="var(--game-gold)"
                        strokeDasharray={
                          segment.bridgesRestDays ? "2 4" : undefined
                        }
                        strokeLinecap="square"
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
                              "absolute left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 border-2 border-[var(--game-gold)]",
                              point.date === selectedPoint.date
                                ? "bg-[var(--game-gold)]"
                                : "bg-[var(--game-bg)]",
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
          <div className="p-8 text-center text-sm text-[var(--game-sub)]">
            この つきの きろくは まだ ない
          </div>
        )}
      </div>
    </GameWindow>
  );
}
