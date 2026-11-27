import { getAuth } from "@server/lib/auth";
import { EntriesService } from "@server/modules/entries/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { expenseCategories } from "@/features/entries/utils/journal-preview";
import { ExpenseCategoryYear } from "@/features/ledger/components/expense-category-year";

export const dynamic = "force-dynamic";

function currentYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(new Date());
}

function validYear(year: string | undefined) {
  return year && /^\d{4}$/.test(year) ? year : currentYear();
}

function validCategory(category: string | undefined) {
  return (
    expenseCategories.find((item) => item.code === category)?.code ??
    expenseCategories[0].code
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; category?: string }>;
}) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const year = validYear(params.year);
  const categoryCode = validCategory(params.category);
  const { items } = await EntriesService.listExpenses(
    session.user.id,
    year,
    categoryCode,
  );

  return (
    <ExpenseCategoryYear
      categoryCode={categoryCode}
      entries={items}
      year={year}
    />
  );
}
