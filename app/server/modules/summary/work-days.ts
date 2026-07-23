type WorkDayRow = {
  date: string;
  deliveries: number | null;
  onlineMinutes: number | null;
};

export function countWorkDays(input: {
  detailDates: string[];
  legacyStats: WorkDayRow[];
}): number {
  return new Set([
    ...input.detailDates,
    ...input.legacyStats
      .filter(
        (row) => (row.deliveries ?? 0) > 0 || (row.onlineMinutes ?? 0) > 0,
      )
      .map((row) => row.date),
  ]).size;
}
