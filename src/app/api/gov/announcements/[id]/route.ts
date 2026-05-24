import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  if (!isGov) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) return Response.json({ error: "Not found" }, { status: 404 });

  if (announcement.officerId !== session.user.id && session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return Response.json({ ok: true });
}
