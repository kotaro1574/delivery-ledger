import { getDB } from "@server/db";
import { monthlyGoals } from "@server/db/schema";
import { and, eq } from "drizzle-orm";

export const GoalsService = {
  async find(userId: string, month: string): Promise<number | null> {
    const db = await getDB();
    const rows = await db
      .select({ targetAmount: monthlyGoals.targetAmount })
      .from(monthlyGoals)
      .where(
        and(eq(monthlyGoals.userId, userId), eq(monthlyGoals.month, month)),
      )
      .limit(1);

    return rows[0]?.targetAmount ?? null;
  },

  async upsert(userId: string, month: string, targetAmount: number) {
    const db = await getDB();
    await db
      .insert(monthlyGoals)
      .values({ userId, month, targetAmount })
      .onConflictDoUpdate({
        target: [monthlyGoals.userId, monthlyGoals.month],
        set: { targetAmount },
      });

    return { month, targetAmount };
  },

  async remove(userId: string, month: string) {
    const db = await getDB();
    await db
      .delete(monthlyGoals)
      .where(
        and(eq(monthlyGoals.userId, userId), eq(monthlyGoals.month, month)),
      );

    return { month };
  },
};
