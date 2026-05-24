import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { ReportTimeline } from "@/components/reports/ReportTimeline";
import { IssueTypeBadge } from "@/components/reports/IssueTypeBadge";
import { DeleteReportButton } from "@/components/reports/DeleteReportButton";
import { NON_DELETABLE_STATUSES } from "@/lib/report-constants";
import { MapPin, Calendar, ArrowLeft, User, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = getTranslations(locale);
  const dateLocale = locale === "ro" ? ro : enUS;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      governmentActions: {
        where: { isPublic: true },
        include: { officer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report) notFound();

  const isGov =
    session?.user?.role === "GOVERNMENT_OFFICER" ||
    session?.user?.role === "ADMIN";
  const isOwner = report.userId === session?.user?.id;

  if (!isGov && !isOwner) notFound();

  const issueLabel = t.issueTypes[report.issueType as keyof typeof t.issueTypes] ?? report.issueType;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={isGov ? "/gov/reports" : "/reports"}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-xl font-bold">{issueLabel}</h1>
          <IssueTypeBadge issueType={report.issueType} showLabel={false} size="md" />
        </div>
        {isOwner && !NON_DELETABLE_STATUSES.has(report.status) && (
          <div className="flex items-center gap-2">
            <Link
              href={`/reports/${report.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Link>
            <DeleteReportButton reportId={report.id} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
            <Image src={report.imageUrl} alt={issueLabel} fill className="object-cover" />
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
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
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(report.createdAt), "dd MMMM yyyy, HH:mm", { locale: dateLocale })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{report.user.name}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {report.aiSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.reports.detail.aiAnalysis}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.aiSummary}</p>
              </CardContent>
            </Card>
          )}

          {report.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.reports.detail.description}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t.reports.detail.govActions}</CardTitle>
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

          {isGov && (
            <Link
              href={`/gov/reports/${report.id}`}
              className={`${buttonVariants()} w-full justify-center`}
            >
              {t.reports.detail.manage}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
