import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole, ApprovalStatus } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CITIZEN", "GOVERNMENT_OFFICER"]).default("CITIZEN"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const isGovOfficer = role === "GOVERNMENT_OFFICER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        approvalStatus: isGovOfficer ? ApprovalStatus.PENDING_APPROVAL : ApprovalStatus.ACTIVE,
      },
      select: { id: true, name: true, email: true, role: true, approvalStatus: true, createdAt: true },
    });

    return Response.json(
      { user, pendingApproval: isGovOfficer },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[register]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
