export const AccountCode = {
  cash: "101",
  bank: "102",
  accountsReceivable: "135",
  vehicle: "180",
  equipment: "184",
  ownerDraw: "334",
  accountsPayable: "305",
  ownerContribution: "335",
  openingCapital: "410",
  revenue: "501",
  vehicleExpense: "601",
  travel: "602",
  communication: "603",
  supplies: "604",
  insurance: "605",
  repairs: "606",
  depreciation: "607",
  miscellaneous: "699",
} as const;

export const initialAccounts = [
  { id: 101, code: "101", name: "現金", category: "asset" },
  { id: 102, code: "102", name: "普通預金", category: "asset" },
  { id: 135, code: "135", name: "売掛金", category: "asset" },
  { id: 180, code: "180", name: "車両運搬具", category: "asset" },
  { id: 184, code: "184", name: "工具器具備品", category: "asset" },
  { id: 334, code: "334", name: "事業主貸", category: "asset" },
  { id: 305, code: "305", name: "未払金", category: "liability" },
  { id: 335, code: "335", name: "事業主借", category: "liability" },
  { id: 410, code: "410", name: "元入金", category: "equity" },
  { id: 501, code: "501", name: "売上高", category: "revenue" },
  { id: 601, code: "601", name: "車両費", category: "expense" },
  { id: 602, code: "602", name: "旅費交通費", category: "expense" },
  { id: 603, code: "603", name: "通信費", category: "expense" },
  { id: 604, code: "604", name: "消耗品費", category: "expense" },
  { id: 605, code: "605", name: "損害保険料", category: "expense" },
  { id: 606, code: "606", name: "修繕費", category: "expense" },
  { id: 607, code: "607", name: "減価償却費", category: "expense" },
  { id: 699, code: "699", name: "雑費", category: "expense" },
] as const;

export type AccountCategory = (typeof initialAccounts)[number]["category"];

export const defaultCategoryRatios = [
  { accountCode: AccountCode.vehicleExpense, businessRatio: 80 },
  { accountCode: AccountCode.communication, businessRatio: 70 },
] as const;
