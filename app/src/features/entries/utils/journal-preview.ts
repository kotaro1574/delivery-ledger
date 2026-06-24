export type EntryMode = "income" | "expense";

export type ExpenseCategory = {
  code: string;
  name: string;
  ratio: number;
};

export type PreviewLine = {
  side: "借方" | "貸方";
  account: string;
  amount: number;
};

export const expenseCategories: ExpenseCategory[] = [
  { code: "601", name: "車両費", ratio: 100 },
  { code: "603", name: "通信費", ratio: 70 },
  { code: "604", name: "消耗品費", ratio: 100 },
  { code: "605", name: "損害保険料", ratio: 100 },
  { code: "606", name: "修繕費", ratio: 100 },
  { code: "699", name: "雑費", ratio: 100 },
];

export function buildJournalPreview({
  mode,
  amount,
  category,
}: {
  mode: EntryMode;
  amount: number;
  category: ExpenseCategory;
}): PreviewLine[] {
  if (mode === "income") {
    return [
      { side: "借方", account: "売掛金", amount },
      { side: "貸方", account: "売上高", amount },
    ];
  }

  const businessAmount = Math.round((amount * category.ratio) / 100);
  const privateAmount = amount - businessAmount;
  const lines: PreviewLine[] = [
    { side: "借方", account: category.name, amount: businessAmount },
  ];

  if (privateAmount > 0) {
    lines.push({ side: "借方", account: "事業主貸", amount: privateAmount });
  }

  lines.push({ side: "貸方", account: "現金", amount });
  return lines;
}
