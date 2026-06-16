import { AccountCode } from "@server/lib/accounts";

export type JournalSide = "debit" | "credit";

export type JournalLineInput = {
  accountCode: string;
  side: JournalSide;
  amount: number;
  receiptKey?: string;
};

export type JournalInput =
  | {
      kind: "income";
      userId: string;
      date: string;
      amount: number;
      memo?: string;
    }
  | {
      kind: "expense";
      userId: string;
      date: string;
      amount: number;
      categoryCode: string;
      businessRatio: number;
      receiptKey?: string;
      memo?: string;
    };

export type BuiltJournal = {
  userId: string;
  date: string;
  description: string;
  lines: JournalLineInput[];
  debitTotal: number;
  creditTotal: number;
};

function assertPositiveAmount(amount: number) {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error("金額は1円以上で入力してください");
  }
}

function sumSide(lines: JournalLineInput[], side: JournalSide) {
  return lines
    .filter((line) => line.side === side)
    .reduce((total, line) => total + line.amount, 0);
}

export function buildJournal(input: JournalInput): BuiltJournal {
  assertPositiveAmount(input.amount);

  const lines: JournalLineInput[] =
    input.kind === "income"
      ? [
          {
            accountCode: AccountCode.accountsReceivable,
            side: "debit",
            amount: input.amount,
          },
          {
            accountCode: AccountCode.revenue,
            side: "credit",
            amount: input.amount,
          },
        ]
      : buildExpenseLines(input);

  const debitTotal = sumSide(lines, "debit");
  const creditTotal = sumSide(lines, "credit");

  if (debitTotal !== creditTotal) {
    throw new Error("仕訳の借方と貸方が一致しません");
  }

  return {
    userId: input.userId,
    date: input.date,
    description: input.memo ?? (input.kind === "income" ? "Uber売上" : "経費"),
    lines,
    debitTotal,
    creditTotal,
  };
}

function buildExpenseLines(
  input: Extract<JournalInput, { kind: "expense" }>,
): JournalLineInput[] {
  const businessAmount = Math.round((input.amount * input.businessRatio) / 100);
  const privateAmount = input.amount - businessAmount;
  const lines: JournalLineInput[] = [
    {
      accountCode: input.categoryCode,
      side: "debit",
      amount: businessAmount,
      ...(input.receiptKey ? { receiptKey: input.receiptKey } : {}),
    },
  ];

  if (privateAmount > 0) {
    lines.push({
      accountCode: AccountCode.ownerDraw,
      side: "debit",
      amount: privateAmount,
    });
  }

  lines.push({
    accountCode: AccountCode.cash,
    side: "credit",
    amount: input.amount,
  });

  return lines;
}
