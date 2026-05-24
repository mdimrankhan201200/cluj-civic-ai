import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  if (!isGov) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const closedStatuses = [ReportStatus.COMPLETED, ReportStatus.CLOSED, ReportStatus.RESOLVED];
  const openStatuses = [ReportStatus.PENDING, ReportStatus.ACCEPTED, ReportStatus.UNDER_REVIEW, ReportStatus.WORK_STARTED, ReportStatus.IN_PROGRESS, ReportStatus.DELAYED];

  const [
    totalReports,
    pendingReports,
    criticalOpen,
    byStatus,
    bySeverity,
    byIssueType,
  ] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: { in: ["PENDING", "ACCEPTED"] } } }),
    prisma.report.count({
      where: { severity: "CRITICAL", status: { in: openStatuses } },
    }),
    prisma.report.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.report.groupBy({ by: ["severity"], _count: { id: true } }),
    prisma.report.groupBy({ by: ["issueType"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
  ]);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resolvedThisMonth = await prisma.report.count({
    where: { status: { in: closedStatuses }, updatedAt: { gte: firstOfMonth } },
  });

  return Response.json({
    totalReports,
    pendingReports,
    criticalOpen,
    resolvedThisMonth,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
    byIssueType: byIssueType.map((s) => ({ type: s.issueType, count: s._count.id })),
  });
}
