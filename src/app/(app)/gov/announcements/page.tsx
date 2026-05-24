import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnnouncementsManager } from "@/components/gov/AnnouncementsManager";

export default async function GovAnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isGov =
    session.user.role === "GOVERNMENT_OFFICER" || session.user.role === "ADMIN";
  if (!isGov) redirect("/dashboard");

  const announcements = await prisma.announcement.findMany({
    include: { officer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AnnouncementsManager
      announcements={announcements}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
