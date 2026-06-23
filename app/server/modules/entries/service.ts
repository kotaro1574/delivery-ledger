import { getDB } from "@server/db";
import {
  accounts,
  categoryRatios,
  entryDetails,
  journalEntries,
  journalLines,
} from "@server/db/schema";
import { AccountCode, defaultCategoryRatios } from "@server/lib/accounts";
import { BadRequestError, NotFoundError } from "@server/lib/errors";
import { and, eq, inArray, like } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { buildJournal } from "./journal";
import type { EntriesModel } from "./model";

type EntryInput = EntriesModel.CreateRequest | EntriesModel.UpdateRequest;

function defaultRatioFor(categoryCode: string) {
  return (
    defaultCategoryRatios.find((ratio) => ratio.accountCode === categoryCode)
      ?.businessRatio ?? 100
  );
}

async function findBusinessRatio(userId: string, categoryCode: string) {
  const db = await getDB();
  const accountId = Number(categoryCode);
  const [ratio] = await db
    .select({ businessRatio: categoryRatios.businessRatio })
    .from(categoryRatios)
    .where(
      and(
        eq(categoryRatios.userId, userId),
        eq(categoryRatios.accountId, accountId),
      ),
    )
    .limit(1);

  return ratio?.businessRatio ?? defaultRatioFor(categoryCode);
}

function createDescription(input: EntryInput) {
  if (input.memo) {
    return input.memo;
  }

  return input.kind === "income" ? "Uber売上" : "経費";
}

async function buildJournalForInput(userId: string, input: EntryInput) {
  const businessRatio =
    input.kind === "expense"
      ? await findBusinessRatio(userId, input.categoryCode)
      : undefined;

  return input.kind === "income"
    ? buildJournal({
        kind: "income",
        userId,
        date: input.date,
        amount: input.amount,
        memo: createDescription(input),
      })
    : buildJournal({
        kind: "expense",
        userId,
        date: input.date,
        amount: input.amount,
        categoryCode: input.categoryCode,
        businessRatio: businessRatio ?? 100,
        receiptKey: input.receiptKey,
        memo: createDescription(input),
      });
}

function detailValues(entryId: string, input: EntryInput) {
  return {
    entryId,
    kind: input.kind,
    amount: input.amount,
    categoryCode:
      input.kind === "income" ? AccountCode.revenue : input.categoryCode,
    deliveries: input.kind === "income" ? (input.deliveries ?? null) : null,
    onlineMinutes:
      input.kind === "income" ? (input.onlineMinutes ?? null) : null,
    receiptKey: input.kind === "expense" ? (input.receiptKey ?? null) : null,
  };
}

function journalLineStatements(
  db: Awaited<ReturnType<typeof getDB>>,
  entryId: string,
  lines: ReturnType<typeof buildJournal>["lines"],
) {
  return lines.map((line) =>
    db.insert(journalLines).values({
      entryId,
      accountId: Number(line.accountCode),
      side: line.side,
      amount: line.amount,
      receiptKey: line.receiptKey,
    }),
  );
}

async function expenseBreakdowns(entryIds: string[]) {
  if (entryIds.length === 0) {
    return new Map<string, { businessAmount: number; privateAmount: number }>();
  }

  const db = await getDB();
  const rows = await db
    .select({
      entryId: journalLines.entryId,
      accountCode: accounts.code,
      accountCategory: accounts.category,
      side: journalLines.side,
      amount: journalLines.amount,
    })
    .from(journalLines)
    .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
    .where(inArray(journalLines.entryId, entryIds));

  return rows.reduce((map, row) => {
    const value = map.get(row.entryId) ?? {
      businessAmount: 0,
      privateAmount: 0,
    };

    if (row.side === "debit" && row.accountCategory === "expense") {
      value.businessAmount += row.amount;
    }

    if (row.side === "debit" && row.accountCode === AccountCode.ownerDraw) {
      value.privateAmount += row.amount;
    }

    map.set(row.entryId, value);
    return map;
  }, new Map<string, { businessAmount: number; privateAmount: number }>());
}

export const EntriesService = {
  async create(
    userId: string,
    input: EntriesModel.CreateRequest,
  ): Promise<EntriesModel.CreateResponse> {
    const db = await getDB();
    const entryId = crypto.randomUUID();
    const journal = await buildJournalForInput(userId, input);

    const statements: BatchItem<"sqlite">[] = [
      db.insert(journalEntries).values({
        id: entryId,
        userId,
        entryDate: input.date,
        description: journal.description,
      }),
      ...journalLineStatements(db, entryId, journal.lines),
      db.insert(entryDetails).values(detailValues(entryId, input)),
    ];

    await db.batch(
      statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]],
    );
    return { id: entryId };
  },

  async list(
    userId: string,
    month: string,
  ): Promise<EntriesModel.ListResponse> {
    const db = await getDB();
    const monthLike = `${month}-%`;

    const rows = await db
      .select({
        id: journalEntries.id,
        date: journalEntries.entryDate,
        kind: entryDetails.kind,
        category: accounts.name,
        categoryCode: entryDetails.categoryCode,
        description: journalEntries.description,
        amount: entryDetails.amount,
        deliveries: entryDetails.deliveries,
        onlineMinutes: entryDetails.onlineMinutes,
        receiptKey: entryDetails.receiptKey,
      })
      .from(journalEntries)
      .innerJoin(entryDetails, eq(entryDetails.entryId, journalEntries.id))
      .innerJoin(accounts, eq(accounts.code, entryDetails.categoryCode))
      .where(
        and(
          eq(journalEntries.userId, userId),
          like(journalEntries.entryDate, monthLike),
        ),
      );

    const breakdowns = await expenseBreakdowns(
      rows.filter((row) => row.kind === "expense").map((row) => row.id),
    );

    const items: EntriesModel.Item[] = rows
      .map((row) => ({
        id: row.id,
        date: row.date,
        kind: row.kind,
        category: row.category,
        categoryCode: row.categoryCode,
        description: row.description ?? row.category,
        amount: row.amount,
        deliveries: row.deliveries,
        onlineMinutes: row.onlineMinutes,
        receiptKey: row.receiptKey,
        businessAmount:
          row.kind === "expense"
            ? (breakdowns.get(row.id)?.businessAmount ?? row.amount)
            : null,
        privateAmount:
          row.kind === "expense"
            ? (breakdowns.get(row.id)?.privateAmount ?? 0)
            : null,
      }))
      .sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);
        if (dateOrder !== 0) {
          return dateOrder;
        }
        return a.kind.localeCompare(b.kind);
      });

    return { items };
  },

  async update(
    userId: string,
    entryId: string,
    input: EntriesModel.UpdateRequest,
  ): Promise<EntriesModel.UpdateResponse> {
    const db = await getDB();
    const [entry] = await db
      .select({ id: journalEntries.id, kind: entryDetails.kind })
      .from(journalEntries)
      .innerJoin(entryDetails, eq(entryDetails.entryId, journalEntries.id))
      .where(
        and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)),
      )
      .limit(1);

    if (!entry) {
      throw new NotFoundError("取引が見つかりません");
    }

    if (entry.kind !== input.kind) {
      throw new BadRequestError("収入と経費の種類は変更できません");
    }

    const journal = await buildJournalForInput(userId, input);
    const statements: BatchItem<"sqlite">[] = [
      db
        .update(journalEntries)
        .set({
          entryDate: input.date,
          description: journal.description,
        })
        .where(
          and(
            eq(journalEntries.id, entryId),
            eq(journalEntries.userId, userId),
          ),
        ),
      db.delete(journalLines).where(eq(journalLines.entryId, entryId)),
      ...journalLineStatements(db, entryId, journal.lines),
      db
        .update(entryDetails)
        .set(detailValues(entryId, input))
        .where(eq(entryDetails.entryId, entryId)),
    ];

    await db.batch(
      statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]],
    );
    return { id: entryId };
  },

  async remove(
    userId: string,
    entryId: string,
  ): Promise<EntriesModel.DeleteResponse> {
    const db = await getDB();
    const [entry] = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(
        and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)),
      )
      .limit(1);

    if (!entry) {
      throw new NotFoundError("取引が見つかりません");
    }

    await db.batch([
      db.delete(entryDetails).where(eq(entryDetails.entryId, entryId)),
      db.delete(journalLines).where(eq(journalLines.entryId, entryId)),
      db.delete(journalEntries).where(eq(journalEntries.id, entryId)),
    ]);

    return { id: entryId };
  },

  assertKnownExpenseCategory(categoryCode: string) {
    const account = Number(categoryCode);
    if (![601, 602, 603, 604, 605, 606, 607, 699].includes(account)) {
      throw new BadRequestError("経費カテゴリが正しくありません");
    }
  },
};
