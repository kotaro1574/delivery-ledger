export type MetricInput = {
  revenue: number;
  deliveries: number;
  onlineMinutes: number;
  workDays: number;
};

export type SummaryMetrics = {
  wagePerHour: number;
  perDelivery: number;
  deliveries: number;
  onlineHours: number;
  workDays: number;
};

export function calculateMetrics(input: MetricInput): SummaryMetrics {
  const onlineHours = Math.round((input.onlineMinutes / 60) * 10) / 10;

  return {
    wagePerHour:
      input.onlineMinutes > 0
        ? Math.round(input.revenue / (input.onlineMinutes / 60))
        : 0,
    perDelivery:
      input.deliveries > 0 ? Math.round(input.revenue / input.deliveries) : 0,
    deliveries: input.deliveries,
    onlineHours,
    workDays: input.workDays,
  };
}
