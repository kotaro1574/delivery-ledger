"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import { type FocusEvent, type PointerEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { buildDailyTrend } from "@/features/ledger/utils/daily-trend";

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

function displayMonth(month: string) {
  const [year, rawMonth] = month.split("-");
  return `${year}年${Number(rawMonth)}月`;
}

function showDayLabel(index: number, length: number) {
  return index === 0 || index === length - 1 || (index + 1) % 5 === 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DailyTrendCard({
  month,
  entries,
}: {
  month: string;
  entries: EntriesModel.Item[];
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const trend = buildDailyTrend(month, entries);
  const hasData = trend.points.some(
    (point) => point.revenue > 0 || point.expense > 0,
  );
  const chart = {
    width: 720,
    height: 280,
    left: 40,
    right: 18,
    top: 22,
    bottom: 42,
  };
  const chartWidth = chart.width - chart.left - chart.right;
  const chartHeight = chart.height - chart.top - chart.bottom;
  const values = trend.points.flatMap((point) => [
    point.revenue,
    point.expense,
    point.profit,
  ]);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(0, ...values);
  const range = Math.max(1, maxValue - minValue);
  const scaleY = (value: number) =>
    chart.top + ((maxValue - value) / range) * chartHeight;
  const scaleX = (index: number) =>
    trend.points.length > 1
      ? chart.left + (index / (trend.points.length - 1)) * chartWidth
      : chart.left + chartWidth / 2;
  const zeroY = scaleY(0);
  const barWidth = Math.max(
    3,
    Math.min(10, chartWidth / trend.points.length / 3),
  );
  const profitLine = trend.points
    .map((point, index) => `${scaleX(index)},${scaleY(point.profit)}`)
    .join(" ");
  const tickValues = Array.from(
    new Set([maxValue, Math.round((maxValue + minValue) / 2), 0, minValue]),
  );
  const interactivePoints = trend.points
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.profit);

      return {
        ...point,
        x,
        y,
        xPercent: (x / chart.width) * 100,
        yPercent: (y / chart.height) * 100,
      };
    })
    .filter((point) => point.revenue > 0 || point.expense > 0);
  const activePoint =
    interactivePoints.find((point) => point.date === activeDate) ?? null;
  const tooltipAbove = (activePoint?.yPercent ?? 0) > 52;
  const tooltipTop = activePoint
    ? tooltipAbove
      ? clamp(activePoint.yPercent - 8, 30, 76)
      : clamp(activePoint.yPercent + 8, 20, 64)
    : 0;

  const handleBlur = (event: FocusEvent<HTMLFieldSetElement>) => {
    const nextTarget = event.relatedTarget;

    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setActiveDate(null);
    }
  };
  const selectNearestPoint = (clientX: number, target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();

    if (rect.width <= 0 || interactivePoints.length === 0) {
      return;
    }

    const svgX = clamp((clientX - rect.left) / rect.width, 0, 1) * chart.width;
    const nearest = interactivePoints.reduce((closest, point) =>
      Math.abs(point.x - svgX) < Math.abs(closest.x - svgX) ? point : closest,
    );

    setActiveDate(nearest.date);
  };
  const handlePointerSelect = (event: PointerEvent<HTMLButtonElement>) => {
    selectNearestPoint(event.clientX, event.currentTarget);
  };

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

      <Card className="overflow-hidden border-border bg-card p-0">
        <div className="grid grid-cols-3 border-b border-border bg-[#fffdf7]">
          <div className="border-r border-border p-3 sm:p-4">
            <div className="mb-1 text-[10px] tracking-widest text-muted-foreground sm:text-xs">
              最高利益日
            </div>
            <div className="font-mono text-xl font-bold sm:text-2xl">
              {trend.bestProfitDay?.label ?? "-"}
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

        {hasData ? (
          <div
            className="overflow-x-auto px-4 py-5 sm:p-5"
            data-testid="daily-trend-scroll"
            onScroll={() => setActiveDate(null)}
          >
            <fieldset
              className="relative m-0 min-w-[42rem] border-0 p-0 sm:min-w-0"
              data-testid="daily-trend-chart-area"
              onBlur={handleBlur}
              onPointerLeave={() => setActiveDate(null)}
            >
              <legend className="sr-only">日別収支詳細</legend>
              <svg
                aria-label={`${displayMonth(month)}の日別収支トレンド`}
                className="h-72 w-full overflow-visible"
                role="img"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
              >
                {tickValues.map((value) => {
                  const y = scaleY(value);
                  return (
                    <g key={value}>
                      <line
                        stroke="rgb(222 216 201)"
                        strokeDasharray={value === 0 ? "0" : "4 6"}
                        x1={chart.left}
                        x2={chart.width - chart.right}
                        y1={y}
                        y2={y}
                      />
                      <text
                        fill="rgb(122 116 101)"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="end"
                        x={chart.left - 8}
                        y={y + 4}
                      >
                        {value === 0 ? "0" : compactYen(value)}
                      </text>
                    </g>
                  );
                })}

                {trend.points.map((point, index) => {
                  const x = scaleX(index);
                  const revenueY = scaleY(point.revenue);
                  const expenseY = scaleY(point.expense);

                  return (
                    <g key={point.date}>
                      <rect
                        fill="var(--ledger-income)"
                        height={Math.abs(zeroY - revenueY)}
                        opacity={point.revenue > 0 ? 0.82 : 0}
                        rx="2"
                        width={barWidth}
                        x={x - barWidth - 1}
                        y={Math.min(zeroY, revenueY)}
                      />
                      <rect
                        fill="var(--ledger-expense)"
                        height={Math.abs(zeroY - expenseY)}
                        opacity={point.expense > 0 ? 0.7 : 0}
                        rx="2"
                        width={barWidth}
                        x={x + 1}
                        y={Math.min(zeroY, expenseY)}
                      />
                      {showDayLabel(index, trend.points.length) ? (
                        <text
                          fill="rgb(122 116 101)"
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                          x={x}
                          y={chart.height - 12}
                        >
                          {point.label}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                <polyline
                  fill="none"
                  points={profitLine}
                  stroke="rgb(35 32 27)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                {trend.points.map((point, index) =>
                  point.revenue > 0 || point.expense > 0 ? (
                    <circle
                      cx={scaleX(index)}
                      cy={scaleY(point.profit)}
                      fill="#fffdf7"
                      key={point.date}
                      r="4"
                      stroke="rgb(35 32 27)"
                      strokeWidth="2"
                    />
                  ) : null,
                )}
              </svg>

              <button
                aria-describedby={
                  activePoint ? "daily-trend-popover" : undefined
                }
                aria-label={`${displayMonth(month)}の日別収支詳細を表示`}
                className="absolute inset-0 z-10 cursor-crosshair rounded-lg bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                onClick={handlePointerSelect}
                onFocus={() =>
                  setActiveDate(interactivePoints[0]?.date ?? null)
                }
                onPointerMove={handlePointerSelect}
                type="button"
              />

              <div className="sr-only">
                {interactivePoints.map((point) => (
                  <button
                    aria-describedby={
                      activePoint?.date === point.date
                        ? "daily-trend-popover"
                        : undefined
                    }
                    aria-label={`${point.label}の収支詳細`}
                    key={point.date}
                    onClick={() => setActiveDate(point.date)}
                    onFocus={() => setActiveDate(point.date)}
                    type="button"
                  />
                ))}
              </div>

              {activePoint ? (
                <div
                  className="pointer-events-none absolute z-20 min-w-40 rounded-lg border border-border bg-[#fffdf7] p-3 text-xs font-bold shadow-lg"
                  id="daily-trend-popover"
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
                    {activePoint.label}
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="text-[var(--ledger-income)]">
                      売上 {yen(activePoint.revenue)}
                    </div>
                    <div className="text-[var(--ledger-expense)]">
                      事業経費 {yen(activePoint.expense)}
                    </div>
                    <div className="text-foreground">
                      利益 {yen(activePoint.profit)}
                    </div>
                  </div>
                </div>
              ) : null}
            </fieldset>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            この月のトレンドはまだありません
          </div>
        )}
      </Card>
    </section>
  );
}
