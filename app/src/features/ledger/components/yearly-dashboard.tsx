"use client";

import type { SummaryModel } from "@server/modules/summary/model";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type FocusEvent, type PointerEvent, useState } from "react";
import { GameWindow } from "@/components/game/game-window";

function yen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function compactYen(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);

  if (absolute >= 10_000) {
    return `${sign}¥${Math.round(absolute / 1000)}k`;
  }

  return `${sign}¥${absolute.toLocaleString("ja-JP")}`;
}

function moveYear(year: string, offset: number) {
  return String(Number.parseInt(year, 10) + offset);
}

function displayYear(year: string) {
  return `${year}年`;
}

function displayMonth(month: string) {
  const [year, rawMonth] = month.split("-");
  return `${year}年${Number(rawMonth)}月`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hasMonthData(month: SummaryModel.YearlyMonth) {
  return month.revenue > 0 || month.expense > 0;
}

export function YearlyDashboard({
  year,
  summary,
}: {
  year: string;
  summary: SummaryModel.YearlyResponse;
}) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const maxCategory = Math.max(
    1,
    ...summary.byCategory.map((item) => item.amount),
  );
  const hasData = summary.monthly.some(hasMonthData);
  const privateExpense = Math.max(0, summary.paidExpense - summary.expense);
  const showExpenseBreakdown = summary.paidExpense > 0 && privateExpense > 0;
  const chart = {
    width: 760,
    height: 300,
    left: 46,
    right: 24,
    top: 26,
    bottom: 46,
  };
  const chartWidth = chart.width - chart.left - chart.right;
  const chartHeight = chart.height - chart.top - chart.bottom;
  const values = summary.monthly.flatMap((month) => [
    month.revenue,
    month.expense,
    month.profit,
  ]);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(0, ...values);
  const range = Math.max(1, maxValue - minValue);
  const scaleY = (value: number) =>
    chart.top + ((maxValue - value) / range) * chartHeight;
  const scaleX = (index: number) =>
    chart.left + (index / (summary.monthly.length - 1)) * chartWidth;
  const zeroY = scaleY(0);
  const barWidth = Math.max(
    10,
    Math.min(18, chartWidth / summary.monthly.length / 4),
  );
  const tickValues = Array.from(
    new Set([maxValue, Math.round(maxValue / 2), 0, minValue]),
  ).sort((left, right) => right - left);
  const profitLine = summary.monthly
    .map((month, index) => `${scaleX(index)},${scaleY(month.profit)}`)
    .join(" ");
  const interactiveMonths = summary.monthly
    .map((month, index) => {
      const x = scaleX(index);
      const y = scaleY(month.profit);

      return {
        ...month,
        x,
        y,
        xPercent: (x / chart.width) * 100,
        yPercent: (y / chart.height) * 100,
      };
    })
    .filter(hasMonthData);
  const activePoint =
    interactiveMonths.find((month) => month.month === activeMonth) ?? null;
  const tooltipAbove = (activePoint?.yPercent ?? 0) > 52;
  const tooltipTop = activePoint
    ? tooltipAbove
      ? clamp(activePoint.yPercent - 8, 30, 76)
      : clamp(activePoint.yPercent + 8, 20, 64)
    : 0;
  const maxRate = Math.max(
    100,
    ...summary.monthly.map((month) => Math.abs(month.profitRate)),
  );

  const handleBlur = (event: FocusEvent<HTMLFieldSetElement>) => {
    const nextTarget = event.relatedTarget;

    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setActiveMonth(null);
    }
  };

  const selectNearestMonth = (clientX: number, target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();

    if (rect.width <= 0 || interactiveMonths.length === 0) {
      return;
    }

    const svgX = clamp((clientX - rect.left) / rect.width, 0, 1) * chart.width;
    const nearest = interactiveMonths.reduce((closest, point) =>
      Math.abs(point.x - svgX) < Math.abs(closest.x - svgX) ? point : closest,
    );

    setActiveMonth(nearest.month);
  };

  const handlePointerSelect = (event: PointerEvent<HTMLButtonElement>) => {
    selectNearestMonth(event.clientX, event.currentTarget);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm tracking-[0.2em] text-[var(--game-sub)]">
          としの きろく
        </div>
        <div className="flex items-center gap-3">
          <Link
            aria-label="まえの とし"
            className="grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
            href={`/year?year=${moveYear(year, -1)}`}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-24 text-center font-mono text-base font-bold text-[var(--game-gold)]">
            {displayYear(year)}
          </div>
          <Link
            aria-label="つぎの とし"
            className="grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
            href={`/year?year=${moveYear(year, 1)}`}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <GameWindow
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        title="ねんかんの しゅうし"
      >
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            ねんかん うりあげ
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
          <div className="font-mono text-2xl font-bold text-[var(--game-gold)]">
            {yen(summary.profit)}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs tracking-widest text-[var(--game-sub)]">
            利益率
          </div>
          <div className="font-mono text-2xl font-bold">
            {summary.profitRate}%
          </div>
          <div className="mt-1 text-xs text-[var(--game-sub)]">
            差引利益 ÷ 売上
          </div>
        </div>
      </GameWindow>

      <GameWindow
        className="overflow-hidden px-0 pb-0"
        title="つきごとの しゅうし"
      >
        <div className="flex flex-wrap justify-end gap-3 px-4 text-xs text-[var(--game-sub)]">
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
          {hasData ? (
            <div
              className="overflow-x-auto px-4 py-5 sm:p-5"
              data-testid="yearly-trend-scroll"
              onScroll={() => setActiveMonth(null)}
            >
              <fieldset
                className="relative m-0 min-w-[44rem] border-0 p-0 sm:min-w-0"
                data-testid="yearly-trend-chart-area"
                onBlur={handleBlur}
                onPointerLeave={() => setActiveMonth(null)}
              >
                <legend className="sr-only">つきごとの しゅうし</legend>
                <svg
                  aria-label={`${displayYear(year)}の つきごとの しゅうし`}
                  className="h-72 w-full overflow-visible"
                  role="img"
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                >
                  {tickValues.map((value) => {
                    const y = scaleY(value);

                    return (
                      <g key={value}>
                        <line
                          stroke="rgb(255 255 255 / 25%)"
                          strokeDasharray={value === 0 ? "0" : "4 6"}
                          x1={chart.left}
                          x2={chart.width - chart.right}
                          y1={y}
                          y2={y}
                        />
                        <text
                          fill="var(--game-sub)"
                          fontSize="11"
                          fontFamily="var(--font-mono)"
                          textAnchor="end"
                          x={chart.left - 8}
                          y={y + 4}
                        >
                          {value === 0 ? "0" : compactYen(value)}
                        </text>
                      </g>
                    );
                  })}

                  {summary.monthly.map((month, index) => {
                    const x = scaleX(index);
                    const revenueY = scaleY(month.revenue);
                    const expenseY = scaleY(month.expense);

                    return (
                      <g key={month.month}>
                        <rect
                          fill="var(--game-income)"
                          height={Math.abs(zeroY - revenueY)}
                          opacity={month.revenue > 0 ? 1 : 0}
                          rx="2"
                          width={barWidth}
                          x={x - barWidth - 2}
                          y={Math.min(zeroY, revenueY)}
                        />
                        <rect
                          fill="var(--game-expense)"
                          height={Math.abs(zeroY - expenseY)}
                          opacity={month.expense > 0 ? 1 : 0}
                          rx="2"
                          width={barWidth}
                          x={x + 2}
                          y={Math.min(zeroY, expenseY)}
                        />
                        <text
                          fill="var(--game-sub)"
                          fontSize="11"
                          fontFamily="var(--font-mono)"
                          textAnchor="middle"
                          x={x}
                          y={chart.height - 14}
                        >
                          {month.label}
                        </text>
                      </g>
                    );
                  })}

                  <polyline
                    fill="none"
                    points={profitLine}
                    stroke="var(--game-gold)"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth="3"
                  />
                  {summary.monthly.map((month, index) =>
                    hasMonthData(month) ? (
                      <circle
                        cx={scaleX(index)}
                        cy={scaleY(month.profit)}
                        fill="var(--game-bg)"
                        key={month.month}
                        r="4"
                        stroke="var(--game-gold)"
                        strokeWidth="2"
                      />
                    ) : null,
                  )}
                </svg>

                <button
                  aria-describedby={
                    activePoint ? "yearly-trend-popover" : undefined
                  }
                  aria-label={`${displayYear(year)}の月別収支詳細を表示`}
                  className="absolute inset-0 z-10 cursor-crosshair rounded-lg bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
                  onClick={handlePointerSelect}
                  onFocus={() =>
                    setActiveMonth(interactiveMonths[0]?.month ?? null)
                  }
                  onPointerMove={handlePointerSelect}
                  type="button"
                />

                <div className="sr-only">
                  {interactiveMonths.map((month) => (
                    <button
                      aria-describedby={
                        activePoint?.month === month.month
                          ? "yearly-trend-popover"
                          : undefined
                      }
                      aria-label={`${month.label}の年次収支詳細`}
                      key={month.month}
                      onClick={() => setActiveMonth(month.month)}
                      onFocus={() => setActiveMonth(month.month)}
                      type="button"
                    />
                  ))}
                </div>

                {activePoint ? (
                  <div
                    className="pointer-events-none absolute z-20 min-w-44 rounded-[4px] border-[3px] border-[var(--game-line)] bg-[var(--game-bg)] p-3 font-mono text-xs shadow-[0_0_0_3px_var(--game-bg)]"
                    id="yearly-trend-popover"
                    role="tooltip"
                    style={{
                      left: `${clamp(activePoint.xPercent, 24, 76)}%`,
                      top: `${tooltipTop}%`,
                      transform: tooltipAbove
                        ? "translate(-50%, -100%)"
                        : "translate(-50%, 0)",
                    }}
                  >
                    <div className="mb-2 font-mono text-sm">
                      {displayMonth(activePoint.month)}
                    </div>
                    <div className="space-y-1 text-[var(--game-sub)]">
                      <div className="text-[var(--game-income)]">
                        うりあげ {yen(activePoint.revenue)}
                      </div>
                      <div className="text-[var(--game-expense)]">
                        事業経費 {yen(activePoint.expense)}
                      </div>
                      <div className="text-[var(--game-gold)]">
                        差引利益 {yen(activePoint.profit)}
                      </div>
                      <div>利益率 {activePoint.profitRate}%</div>
                    </div>
                  </div>
                ) : null}
              </fieldset>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--game-sub)]">
              この としの きろくは まだ ない
            </div>
          )}
        </div>
      </GameWindow>

      <GameWindow className="overflow-hidden px-0 pb-0" title="月別利益率">
        <div>
          <div className="overflow-x-auto px-4 pb-4">
            <div className="grid min-w-[40rem] grid-cols-12 items-end gap-3 sm:min-w-0">
              {summary.monthly.map((month) => {
                const rateHeight =
                  month.revenue > 0
                    ? Math.max(4, (Math.abs(month.profitRate) / maxRate) * 100)
                    : 0;

                return (
                  <div
                    className="flex flex-col items-center gap-2"
                    key={month.month}
                  >
                    <div className="flex h-32 w-full items-end border-2 border-[var(--game-line)]/40 bg-[var(--game-panel)] px-1.5 py-2">
                      <div
                        className={
                          month.profitRate < 0
                            ? "w-full bg-[var(--game-expense)]"
                            : "w-full bg-[var(--game-income)]"
                        }
                        style={{ height: `${rateHeight}%` }}
                      />
                    </div>
                    <div className="font-mono text-xs font-bold">
                      {month.profitRate}%
                    </div>
                    <div className="font-mono text-xs text-[var(--game-sub)]">
                      {month.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GameWindow>

      <GameWindow className="px-0 pb-1" title="年間経費内訳（事業分）">
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
              この としの けいひは まだ ない
            </div>
          )}
        </div>
      </GameWindow>
    </div>
  );
}
