import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GovStatsCards } from "@/components/gov/GovStatsCards";
import { IssueTypeChart } from "@/components/gov/IssueTypeChart";
import { SeverityChart } from "@/components/gov/SeverityChart";
import { ReportCard } from "@/components/reports/ReportCard";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function GovDashboardPage() {
  const session = await auth();
  if (
    session?.user?.role !== "GOVERNMENT_OFFICER" &&
    session?.user?.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const t = getTranslations(locale);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, pending, critical, resolvedThisMonth, byIssueType, bySeverity, criticalReports] =
    await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { severity: "CRITICAL", status: { in: ["PENDING", "ACCEPTED", "UNDER_REVIEW", "WORK_STARTED", "IN_PROGRESS", "DELAYED"] } } }),
      prisma.report.count({ where: { status: { in: ["COMPLETED", "CLOSED", "RESOLVED"] }, updatedAt: { gte: firstOfMonth } } }),
      prisma.report.groupBy({
        by: ["issueType"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.report.groupBy({ by: ["severity"], _count: { id: true } }),
      prisma.report.findMany({
        where: { severity: "CRITICAL", status: { in: ["PENDING", "ACCEPTED", "UNDER_REVIEW", "WORK_STARTED", "IN_PROGRESS", "DELAYED"] } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.govDashboard.title}</h1>
          <p className="text-muted-foreground">{t.govDashboard.subtitle}</p>
        </div>
        <Link href="/gov/reports" className={buttonVariants({ variant: "outline" })}>
          {t.govDashboard.allReports}
        </Link>
      </div>

      <GovStatsCards
        total={total}
        pending={pending}
        critical={critical}
        resolvedThisMonth={resolvedThisMonth}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IssueTypeChart
          data={byIssueType.map((d) => ({ type: d.issueType, count: d._count.id }))}
        />
        <SeverityChart
          data={bySeverity.map((d) => ({ severity: d.severity, count: d._count.id }))}
        />
      </div>

      {criticalReports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-600">{t.govDashboard.criticalAlerts}</h2>
            <Link
              href="/gov/reports?severity=CRITICAL"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t.govDashboard.viewAll}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {criticalReports.map((r) => (
              <ReportCard key={r.id} report={r} href={`/gov/reports/${r.id}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
