export function countKingMonths(
  goals: { month: string; targetAmount: number }[],
  revenues: { month: string; total: number }[],
) {
  const revenueByMonth = new Map(
    revenues.map((item) => [item.month, item.total]),
  );

  return goals.filter(
    (goal) => (revenueByMonth.get(goal.month) ?? 0) >= goal.targetAmount,
  ).length;
}
