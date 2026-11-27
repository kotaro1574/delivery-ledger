type StatRow = {
  date: string;
  deliveries: number | null;
  onlineMinutes: number | null;
};

export type DailyStat = {
  date: string;
  deliveries: number;
  onlineMinutes: number;
};

function sumByDate(rows: StatRow[]) {
  const totals = new Map<string, DailyStat>();
  for (const row of rows) {
    const current = totals.get(row.date) ?? {
      date: row.date,
      deliveries: 0,
      onlineMinutes: 0,
    };
    totals.set(row.date, {
      date: row.date,
      deliveries: current.deliveries + (row.deliveries ?? 0),
      onlineMinutes: current.onlineMinutes + (row.onlineMinutes ?? 0),
    });
  }
  return totals;
}

function hasWork(stat: DailyStat) {
  return stat.deliveries > 0 || stat.onlineMinutes > 0;
}

export function buildDailyStats(input: {
  detailRows: StatRow[];
  legacyRows: StatRow[];
}): DailyStat[] {
  const detail = [...sumByDate(input.detailRows).values()].filter(hasWork);
  const detailDates = new Set(detail.map((stat) => stat.date));
  const legacy = [...sumByDate(input.legacyRows).values()].filter(
    (stat) => hasWork(stat) && !detailDates.has(stat.date),
  );

  return [...detail, ...legacy].sort((a, b) => a.date.localeCompare(b.date));
}
