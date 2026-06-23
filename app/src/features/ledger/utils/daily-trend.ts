import type { EntriesModel } from "@server/modules/entries/model";

export type DailyTrendPoint = {
  date: string;
  label: string;
  revenue: number;
  expense: number;
  profit: number;
};

export type DailyTrend = {
  points: DailyTrendPoint[];
  bestProfitDay: { date: string; label: string; profit: number } | null;
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
    return {
      date: monthDay(month, day),
      label: dayLabel(month, day),
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

  const activePoints = points.filter(
    (point) => point.revenue > 0 || point.expense > 0,
  );
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
