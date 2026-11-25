import { getAuth } from "@server/lib/auth";
import { EntriesService } from "@server/modules/entries/service";
import { SummaryService } from "@server/modules/summary/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LedgerDashboard } from "@/features/ledger/components/ledger-dashboard";
import { parseGained } from "@/features/motivation/utils/gained-param";
import { tokyoDateString } from "@/lib/date";

export const dynamic = "force-dynamic";

function validMonth(month: string | undefined, today: string) {
  return month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; gained?: string }>;
}) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const today = tokyoDateString(new Date());
  const month = validMonth(params.month, today);
  const [summary, entries] = await Promise.all([
    SummaryService.monthly(session.user.id, month),
    EntriesService.list(session.user.id, month),
  ]);

  return (
    <LedgerDashboard
      month={month}
      today={today}
      summary={summary}
      entries={entries.items}
      gained={parseGained(params.gained, summary.lifetimeRevenue)}
    />
  );
}
