import { getAuth } from "@server/lib/auth";
import { SummaryService } from "@server/modules/summary/service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { YearlyDashboard } from "@/features/ledger/components/yearly-dashboard";

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
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
  const summary = await SummaryService.yearly(session.user.id, year);

  return <YearlyDashboard year={year} summary={summary} />;
}
