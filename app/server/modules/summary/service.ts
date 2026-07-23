import { getDB } from "@server/db";
import {
  accounts,
  dailyStats,
  entryDetails,
  journalEntries,
  journalLines,
} from "@server/db/schema";
import { and, eq, like, sql } from "drizzle-orm";
import { calculateMetrics } from "./metrics";
import type { SummaryModel } from "./model";
import { countWorkDays } from "./work-days";
import { buildYearlySummary } from "./yearly";

export const SummaryService = {
  async monthly(userId: string, month: string): Promise<SummaryModel.Response> {
    const db = await getDB();
    const monthLike = `${month}-%`;

    const [
      revenueResult,
      expenseResult,
      paidExpenseResult,
      byCategory,
      detailStatsRows,
      legacyStatsRows,
    ] = await Promise.all([
      db
        .select({
          total: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, monthLike),
            eq(accounts.category, "revenue"),
            eq(journalLines.side, "credit"),
          ),
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, monthLike),
            eq(accounts.category, "expense"),
            eq(journalLines.side, "debit"),
          ),
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${entryDetails.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(entryDetails, eq(entryDetails.entryId, journalEntries.id))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, monthLike),
            eq(entryDetails.kind, "expense"),
          ),
        ),
      db
        .select({
          code: accounts.code,
          name: accounts.name,
          amount: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, monthLike),
            eq(accounts.category, "expense"),
            eq(journalLines.side, "debit"),
          ),
        )
        .groupBy(accounts.code, accounts.name),
      db
        .select({
          date: journalEntries.entryDate,
          deliveries: entryDetails.deliveries,
          onlineMinutes: entryDetails.onlineMinutes,
        })
        .from(journalEntries)
        .innerJoin(entryDetails, eq(entryDetails.entryId, journalEntries.id))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, monthLike),
            eq(entryDetails.kind, "income"),
          ),
        ),
      db
        .select({
          date: dailyStats.statDate,
          deliveries: dailyStats.deliveries,
          onlineMinutes: dailyStats.onlineMinutes,
        })
        .from(dailyStats)
        .where(
          and(
            eq(dailyStats.userId, userId),
            like(dailyStats.statDate, monthLike),
          ),
        ),
    ]);

    const revenue = revenueResult[0]?.total ?? 0;
    const expense = expenseResult[0]?.total ?? 0;
    const paidExpense = paidExpenseResult[0]?.total ?? 0;
    const detailDatesWithStats = new Set(
      detailStatsRows
        .filter(
          (row) => (row.deliveries ?? 0) > 0 || (row.onlineMinutes ?? 0) > 0,
        )
        .map((row) => row.date),
    );
    const detailStats = detailStatsRows.reduce(
      (total, row) => ({
        deliveries: total.deliveries + (row.deliveries ?? 0),
        onlineMinutes: total.onlineMinutes + (row.onlineMinutes ?? 0),
      }),
      { deliveries: 0, onlineMinutes: 0 },
    );
    const legacyRows = legacyStatsRows.filter(
      (row) => !detailDatesWithStats.has(row.date),
    );
    const legacyStats = legacyRows.reduce(
      (total, row) => ({
        deliveries: total.deliveries + (row.deliveries ?? 0),
        onlineMinutes: total.onlineMinutes + (row.onlineMinutes ?? 0),
      }),
      { deliveries: 0, onlineMinutes: 0 },
    );
    const stats = {
      deliveries: detailStats.deliveries + legacyStats.deliveries,
      onlineMinutes: detailStats.onlineMinutes + legacyStats.onlineMinutes,
    };
    const workDays = countWorkDays({
      detailDates: detailStatsRows.map((row) => row.date),
      legacyStats: legacyRows,
    });

    return {
      revenue,
      expense,
      paidExpense,
      profit: revenue - expense,
      byCategory,
      metrics: calculateMetrics({
        revenue,
        deliveries: stats.deliveries ?? 0,
        onlineMinutes: stats.onlineMinutes ?? 0,
        workDays,
      }),
    };
  },

  async yearly(
    userId: string,
    year: string,
  ): Promise<SummaryModel.YearlyResponse> {
    const db = await getDB();
    const yearLike = `${year}-%`;
    const monthColumn = sql<string>`substr(${journalEntries.entryDate}, 1, 7)`;

    const [revenue, expense, paidExpense, byCategory] = await Promise.all([
      db
        .select({
          month: monthColumn,
          total: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, yearLike),
            eq(accounts.category, "revenue"),
            eq(journalLines.side, "credit"),
          ),
        )
        .groupBy(monthColumn),
      db
        .select({
          month: monthColumn,
          total: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, yearLike),
            eq(accounts.category, "expense"),
            eq(journalLines.side, "debit"),
          ),
        )
        .groupBy(monthColumn),
      db
        .select({
          month: monthColumn,
          total: sql<number>`coalesce(sum(${entryDetails.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(entryDetails, eq(entryDetails.entryId, journalEntries.id))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, yearLike),
            eq(entryDetails.kind, "expense"),
          ),
        )
        .groupBy(monthColumn),
      db
        .select({
          code: accounts.code,
          name: accounts.name,
          amount: sql<number>`coalesce(sum(${journalLines.amount}), 0)`,
        })
        .from(journalEntries)
        .innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(
          and(
            eq(journalEntries.userId, userId),
            like(journalEntries.entryDate, yearLike),
            eq(accounts.category, "expense"),
            eq(journalLines.side, "debit"),
          ),
        )
        .groupBy(accounts.code, accounts.name),
    ]);

    return buildYearlySummary({
      year,
      revenue,
      expense,
      paidExpense,
      byCategory,
    });
  },
};
