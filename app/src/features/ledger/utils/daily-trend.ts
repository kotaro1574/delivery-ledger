import type { EntriesModel } from "@server/modules/entries/model";
import { parseDateString } from "@/lib/date";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type WeekdayLabel = (typeof weekdayLabels)[number];

export type DailyTrendPoint = {
  date: string;
  label: string;
  day: number;
  weekday: number;
  weekdayLabel: WeekdayLabel;
  revenue: number;
  expense: number;
  profit: number;
};

export type DailyTrend = {
  points: DailyTrendPoint[];
  bestProfitDay: {
    date: string;
    label: string;
    weekdayLabel: WeekdayLabel;
    profit: number;
  } | null;
  averageProfit: number;
  expenseRate: number;
};

function daysInMonth(month: string) {
  const [year, rawMonth] = month.split("-").map(Number);
  return new Date(year, rawMonth, 0).getDate();
}

function monthDay(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function dayLabel(month: string, day: number) {
  return `${Number(month.slice(5))}/${day}`;
}

function businessExpense(entry: EntriesModel.Item) {
  if (entry.kind !== "expense") {
    return 0;
  }

  return entry.businessAmount ?? entry.amount;
}

export function buildDailyTrend(
  month: string,
  entries: EntriesModel.Item[],
): DailyTrend {
  const points = Array.from({ length: daysInMonth(month) }, (_, index) => {
    const day = index + 1;
    const date = monthDay(month, day);
    const weekday = parseDateString(date).getDay();
    return {
      date,
      label: dayLabel(month, day),
      day,
      weekday,
      weekdayLabel: weekdayLabels[weekday],
      revenue: 0,
      expense: 0,
      profit: 0,
    };
  });
  const byDate = new Map(points.map((point) => [point.date, point]));

  for (const entry of entries) {
    const point = byDate.get(entry.date);

    if (!point) {
      continue;
    }

    if (entry.kind === "income") {
      point.revenue += entry.amount;
    } else {
      point.expense += businessExpense(entry);
    }

    point.profit = point.revenue - point.expense;
  }

  const activePoints = points.filter(isActiveDay);
  const totalRevenue = activePoints.reduce(
    (total, point) => total + point.revenue,
    0,
  );
  const totalExpense = activePoints.reduce(
    (total, point) => total + point.expense,
    0,
  );
  const totalProfit = activePoints.reduce(
    (total, point) => total + point.profit,
    0,
  );
  const bestProfitPoint =
    activePoints.length > 0
      ? activePoints.reduce((best, point) =>
          point.profit > best.profit ? point : best,
        )
      : null;

  return {
    points,
    bestProfitDay: bestProfitPoint
      ? {
          date: bestProfitPoint.date,
          label: bestProfitPoint.label,
          weekdayLabel: bestProfitPoint.weekdayLabel,
          profit: bestProfitPoint.profit,
        }
      : null,
    averageProfit:
      activePoints.length > 0
        ? Math.round(totalProfit / activePoints.length)
        : 0,
    expenseRate:
      totalRevenue > 0 ? Math.round((totalExpense / totalRevenue) * 100) : 0,
  };
}

export function isActiveDay(point: DailyTrendPoint) {
  return point.revenue > 0 || point.expense > 0;
}

export type AmountAxis = {
  min: number;
  max: number;
  ticks: number[];
};

function niceStep(roughStep: number) {
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const factor = [1, 2, 2.5, 5, 10].find((value) => normalized <= value) ?? 10;

  return factor * magnitude;
}

export function buildAmountAxis(values: number[], targetTicks = 4): AmountAxis {
  const dataMax = Math.max(0, ...values);
  const dataMin = Math.min(0, ...values);

  if (dataMax === 0 && dataMin === 0) {
    return { min: 0, max: 1000, ticks: [0, 500, 1000] };
  }

  const step = Math.max(1, niceStep((dataMax - dataMin) / targetTicks));
  const min = Math.floor(dataMin / step) * step;
  const max = Math.ceil(dataMax / step) * step;
  const ticks = Array.from(
    { length: Math.round((max - min) / step) + 1 },
    (_, index) => min + index * step,
  );

  return { min, max, ticks };
}

export function compactAmount(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);

  if (absolute >= 10_000) {
    return `${sign}${Number((absolute / 10_000).toFixed(1))}万`;
  }

  return `${sign}${absolute.toLocaleString("ja-JP")}`;
}

export type ProfitSegment = {
  from: number;
  to: number;
  bridgesRestDays: boolean;
};

export function buildProfitSegments(points: DailyTrendPoint[]) {
  const activeIndexes = points.flatMap((point, index) =>
    isActiveDay(point) ? [index] : [],
  );

  return activeIndexes.slice(1).map(
    (to, position): ProfitSegment => ({
      from: activeIndexes[position],
      to,
      bridgesRestDays: to - activeIndexes[position] > 1,
    }),
  );
}
