import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { StatusUpdateForm } from "@/components/gov/StatusUpdateForm";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function GovReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (
    session?.user?.role !== "GOVERNMENT_OFFICER" &&
    session?.user?.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const t = getTranslations(locale);
  const dateLocale = locale === "ro" ? ro : enUS;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      governmentActions: {
        include: { officer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report) notFound();

  const issueLabel =
    t.issueTypes[report.issueType as keyof typeof t.issueTypes] ?? report.issueType;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/gov/reports" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{issueLabel}</h1>
          <p className="text-muted-foreground text-sm">
            {t.govReports.detail.govActions.includes("History") ? "ID:" : t.reports.detail.id}{" "}
            {report.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative h-72 rounded-lg overflow-hidden bg-muted">
            <Image src={report.imageUrl} alt={issueLabel} fill className="object-cover" />
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>

              {report.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{report.address}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {report.user.name} ({report.user.email})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(report.createdAt), "dd MMMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })}
                </span>
              </div>

              {report.aiSummary && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    {t.govReports.detail.aiAnalysis}
                  </p>
                  <p className="text-sm">{report.aiSummary}</p>
                </div>
              )}

              {report.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t.govReports.detail.citizenDesc}
                  </p>
                  <p className="text-sm">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t.govReports.detail.govActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTimeline
                createdAt={report.createdAt.toISOString()}
                status={report.status}
                actions={report.governmentActions.map(a => ({
                  ...a,
                  estimatedCompletion: a.estimatedCompletion?.toISOString() ?? null,
                  createdAt: a.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <StatusUpdateForm reportId={report.id} currentStatus={report.status} />
        </div>
      </div>
    </div>
  );
}
