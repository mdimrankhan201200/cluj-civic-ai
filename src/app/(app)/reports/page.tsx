import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";
import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

const FILTER_STATUS_MAP: Record<string, string[]> = {
  pending:    ["PENDING", "ACCEPTED", "UNDER_REVIEW"],
  inprogress: ["WORK_STARTED", "IN_PROGRESS", "DELAYED"],
  resolved:   ["COMPLETED", "CLOSED", "RESOLVED"],
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const t = getTranslations(locale);
  const { filter, category } = await searchParams;

  const statusFilter = filter && FILTER_STATUS_MAP[filter];
  const validCategory = category && ISSUE_TYPE_META[category] ? category : undefined;

  const reports = await prisma.report.findMany({
    where: {
      userId: session!.user.id,
      ...(statusFilter ? { status: { in: statusFilter as never[] } } : {}),
      ...(validCategory ? { issueType: validCategory as never } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const hasFilters = !!filter || !!validCategory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.reports.title}</h1>
        <Link href="/reports/new" className={buttonVariants()}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t.reports.reportProblem}
        </Link>
      </div>

      <Suspense fallback={<div className="h-16 bg-muted/30 animate-pulse rounded-lg" />}>
        <ReportFilters />
      </Suspense>

      {reports.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">
            {hasFilters ? "No reports match the selected filters." : t.reports.noReports}
          </p>
          {!hasFilters && (
            <Link href="/reports/new" className={`${buttonVariants()} mt-4`}>
              {t.reports.firstReport}
            </Link>
          )}
          {hasFilters && (
            <Link href="/reports" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} canDelete={true} />
          ))}
        </div>
      )}
    </div>
  );
}
