import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApprovalStatus } from "@prisma/client";

const schema = z.object({
  action: z.enum(["approve", "suspend"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const newStatus =
    parsed.data.action === "approve" ? ApprovalStatus.ACTIVE : ApprovalStatus.SUSPENDED;

  const user = await prisma.user.update({
    where: { id },
    data: { approvalStatus: newStatus },
    select: { id: true, name: true, email: true, approvalStatus: true },
  });

  return Response.json({ user });
}
