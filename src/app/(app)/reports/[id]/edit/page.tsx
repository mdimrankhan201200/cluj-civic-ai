import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EditReportForm } from "@/components/reports/EditReportForm";
import { NON_DELETABLE_STATUSES } from "@/lib/report-constants";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) notFound();

  const isOwner = report.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) notFound();

  if (!isAdmin && NON_DELETABLE_STATUSES.has(report.status)) {
    redirect(`/reports/${id}`);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/reports/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">Edit Report</h1>
      </div>

      <EditReportForm
        reportId={id}
        defaultIssueType={report.issueType}
        defaultSeverity={report.severity}
        defaultDescription={report.description ?? undefined}
        defaultImageUrl={report.imageUrl}
      />
    </div>
  );
}
