import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    include: { officer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: announcements });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  if (!isGov) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        officerId: session.user.id,
      },
      include: { officer: { select: { id: true, name: true } } },
    });

    return Response.json({ data: announcement }, { status: 201 });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
