import type { SummaryModel } from "./model";

type NumericValue = number | string | null | undefined;

type MonthlyTotalRow = {
  month: string;
  total: NumericValue;
};

type CategoryTotalRow = {
  code: string;
  name: string;
  amount: NumericValue;
};

export type YearlySummaryInput = {
  year: string;
  revenue: MonthlyTotalRow[];
  expense: MonthlyTotalRow[];
  paidExpense: MonthlyTotalRow[];
  byCategory: CategoryTotalRow[];
};

function toNumber(value: NumericValue) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function monthId(year: string, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function totalByMonth(rows: MonthlyTotalRow[]) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.month, (totals.get(row.month) ?? 0) + toNumber(row.total));
  }

  return totals;
}

function profitRate(profit: number, revenue: number) {
  return revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
}

export function buildYearlySummary(
  input: YearlySummaryInput,
): SummaryModel.YearlyResponse {
  const revenueByMonth = totalByMonth(input.revenue);
  const expenseByMonth = totalByMonth(input.expense);
  const paidExpenseByMonth = totalByMonth(input.paidExpense);
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const month = monthId(input.year, index);
    const revenue = revenueByMonth.get(month) ?? 0;
    const expense = expenseByMonth.get(month) ?? 0;
    const paidExpense = paidExpenseByMonth.get(month) ?? 0;
    const profit = revenue - expense;

    return {
      month,
      label: `${index + 1}月`,
      revenue,
      expense,
      paidExpense,
      profit,
      profitRate: profitRate(profit, revenue),
    };
  });
  const revenue = monthly.reduce((total, month) => total + month.revenue, 0);
  const expense = monthly.reduce((total, month) => total + month.expense, 0);
  const paidExpense = monthly.reduce(
    (total, month) => total + month.paidExpense,
    0,
  );
  const profit = revenue - expense;

  return {
    year: input.year,
    revenue,
    expense,
    paidExpense,
    profit,
    profitRate: profitRate(profit, revenue),
    monthly,
    byCategory: input.byCategory
      .map((item) => ({
        code: item.code,
        name: item.name,
        amount: toNumber(item.amount),
      }))
      .sort((left, right) => right.amount - left.amount),
  };
}
