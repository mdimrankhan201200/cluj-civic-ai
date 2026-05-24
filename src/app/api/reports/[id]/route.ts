import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IssueType, ReportStatus, Severity } from "@prisma/client";
import { z } from "zod";

const citizenEditSchema = z.object({
  issueType: z.nativeEnum(IssueType),
  severity: z.nativeEnum(Severity),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  aiSummary: z.string().optional(),
});

const updateSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  assignedTeam: z.string().optional(),
  actionTaken: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
  estimatedCompletion: z.string().optional(),
  delayReason: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const DELETABLE_STATUSES = new Set<ReportStatus>([
  ReportStatus.PENDING,
  ReportStatus.ACCEPTED,
  ReportStatus.UNDER_REVIEW,
  ReportStatus.REJECTED,
]);

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });

  const isOwner = report.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdmin && !DELETABLE_STATUSES.has(report.status)) {
    return Response.json(
      { error: "Cannot delete a report that is already being worked on" },
      { status: 409 }
    );
  }

  await prisma.report.delete({ where: { id } });
  return Response.json({ ok: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  if (!report) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  const isOwner = report.userId === session.user.id;

  if (!isGov && !isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ data: report });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  if (!isGov) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { status, assignedTeam, actionTaken, progress, estimatedCompletion, delayReason, isPublic } = parsed.data;

    const STATUS_NOTIFICATIONS: Partial<Record<ReportStatus, { title: string; message: string }>> = {
      [ReportStatus.ACCEPTED]: { title: "Report accepted", message: "Your report has been accepted by the local authorities." },
      [ReportStatus.UNDER_REVIEW]: { title: "Under review", message: "Your report is currently being reviewed by the technical team." },
      [ReportStatus.WORK_STARTED]: { title: "Work started", message: "The team has started work on the reported issue." },
      [ReportStatus.IN_PROGRESS]: { title: "Work in progress", message: "Work is continuing at the location of your reported issue." },
      [ReportStatus.DELAYED]: { title: "Work delayed", message: `Work has been delayed.${delayReason ? " Reason: " + delayReason : ""}` },
      [ReportStatus.COMPLETED]: { title: "Issue resolved!", message: "Work has been completed successfully. Thank you for reporting!" },
      [ReportStatus.RESOLVED]: { title: "Issue resolved!", message: "The reported issue has been permanently resolved." },
      [ReportStatus.REJECTED]: { title: "Report rejected", message: "Your report has been rejected. Please check the details or contact the authorities." },
      [ReportStatus.CLOSED]: { title: "Report closed", message: "Your report has been marked as closed." },
    };

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: { status },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.governmentAction.create({
        data: {
          reportId: id,
          officerId: session.user.id,
          assignedTeam,
          actionTaken,
          progress,
          estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : undefined,
          delayReason,
          isPublic: isPublic ?? true,
        },
      }),
    ]);

    const notifData = STATUS_NOTIFICATIONS[status];
    if (notifData && report.userId !== session.user.id) {
      await prisma.notification.create({
        data: { userId: report.userId, reportId: id, title: notifData.title, message: notifData.message },
      });
    }

    return Response.json({ data: updatedReport });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });

  const isOwner = report.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdmin && !DELETABLE_STATUSES.has(report.status)) {
    return Response.json(
      { error: "Cannot edit a report that is already being worked on" },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();
    const parsed = citizenEditSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        issueType: parsed.data.issueType,
        severity: parsed.data.severity,
        description: parsed.data.description ?? null,
        ...(parsed.data.imageUrl ? { imageUrl: parsed.data.imageUrl } : {}),
        ...(parsed.data.aiSummary !== undefined ? { aiSummary: parsed.data.aiSummary } : {}),
      },
    });

    return Response.json({ data: updated });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
