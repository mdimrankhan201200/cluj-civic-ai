import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IssueType, Severity, ReportStatus } from "@prisma/client";
import { z } from "zod";

const createReportSchema = z.object({
  imageUrl: z.string().min(1),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  issueType: z.nativeEnum(IssueType),
  severity: z.nativeEnum(Severity),
  aiSummary: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "10"));
  const status = searchParams.get("status") as ReportStatus | null;
  const severity = searchParams.get("severity") as Severity | null;
  const issueType = searchParams.get("issueType") as IssueType | null;

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";

  const where = {
    ...(isGov ? {} : { userId: session.user.id }),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(issueType ? { issueType } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  return Response.json({
    data: reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: { ...parsed.data, userId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return Response.json({ data: report }, { status: 201 });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
