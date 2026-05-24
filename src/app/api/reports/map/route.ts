import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: {
      status: { not: "REJECTED" },
    },
    select: {
      id: true,
      issueType: true,
      severity: true,
      status: true,
      latitude: true,
      longitude: true,
      address: true,
      aiSummary: true,
      imageUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return Response.json({ data: reports });
}
