import type { EntriesModel } from "./model";

export type CategoryYearSummary = {
  business: number;
  paid: number;
  months: number[];
};

export function summarizeCategoryYear(
  items: EntriesModel.Item[],
): CategoryYearSummary {
  const months = Array.from({ length: 12 }, () => 0);
  let business = 0;
  let paid = 0;

  for (const item of items) {
    const businessAmount = item.businessAmount ?? item.amount;
    const month = Number(item.date.slice(5, 7)) - 1;
    business += businessAmount;
    paid += item.amount;
    months[month] += businessAmount;
  }

  return { business, paid, months };
}
