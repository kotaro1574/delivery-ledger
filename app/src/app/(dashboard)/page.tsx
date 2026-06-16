import { getAuth } from "@server/lib/auth";
import { EntriesService } from "@server/modules/entries/service";
import { SummaryService } from "@server/modules/summary/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LedgerDashboard } from "@/features/ledger/components/ledger-dashboard";

export const dynamic = "force-dynamic";

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function validMonth(month: string | undefined) {
  return month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonth();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const month = validMonth(params.month);
  const [summary, entries] = await Promise.all([
    SummaryService.monthly(session.user.id, month),
    EntriesService.list(session.user.id, month),
  ]);

  return (
    <LedgerDashboard month={month} summary={summary} entries={entries.items} />
  );
}
