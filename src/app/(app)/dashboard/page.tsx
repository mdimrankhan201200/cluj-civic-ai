import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ReportCard } from "@/components/reports/ReportCard";
import Link from "next/link";
import { FileText, Clock, Wrench, CheckCircle, PlusCircle } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const locale = await getLocale();
  const t = getTranslations(locale);

  const [total, pending, inProgress, resolved, recentReports] = await Promise.all([
    prisma.report.count({ where: { userId } }),
    prisma.report.count({ where: { userId, status: { in: ["PENDING", "ACCEPTED", "UNDER_REVIEW"] } } }),
    prisma.report.count({ where: { userId, status: { in: ["WORK_STARTED", "IN_PROGRESS", "DELAYED"] } } }),
    prisma.report.count({ where: { userId, status: { in: ["COMPLETED", "CLOSED", "RESOLVED"] } } }),
    prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const stats = [
    { label: t.dashboard.stats.total, value: total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", href: "/reports" },
    { label: t.dashboard.stats.pending, value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", href: "/reports?filter=pending" },
    { label: t.dashboard.stats.inProgress, value: inProgress, icon: Wrench, color: "text-purple-600", bg: "bg-purple-50", href: "/reports?filter=inprogress" },
    { label: t.dashboard.stats.resolved, value: resolved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", href: "/reports?filter=resolved" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t.dashboard.greeting}, {session!.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <Link href="/reports/new" className={buttonVariants()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t.dashboard.reportProblem}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t.dashboard.recentReports}</h2>
          <Link href="/reports" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t.dashboard.viewAll}
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{t.dashboard.noReports}</p>
              <Link href="/reports/new" className={`${buttonVariants()} mt-4`}>
                {t.dashboard.firstReport}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
