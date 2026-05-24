import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PendingOfficersTable } from "@/components/admin/PendingOfficersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, Users } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const t = getTranslations(locale);

  const [pendingOfficers, allOfficers] = await Promise.all([
    prisma.user.findMany({
      where: { role: "GOVERNMENT_OFFICER", approvalStatus: "PENDING_APPROVAL" },
      select: { id: true, name: true, email: true, approvalStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "GOVERNMENT_OFFICER" },
      select: { id: true, name: true, email: true, approvalStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeCount = allOfficers.filter(o => o.approvalStatus === "ACTIVE").length;
  const pendingCount = pendingOfficers.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.title}</h1>
        <p className="text-muted-foreground">{t.admin.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allOfficers.length}</p>
              <p className="text-xs text-muted-foreground">{t.admin.allOfficers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Activi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{t.admin.pendingOfficers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              {t.admin.pendingOfficers} ({pendingCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingOfficersTable officers={pendingOfficers.map(o => ({ ...o, createdAt: o.createdAt.toISOString() }))} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.admin.allOfficers}</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingOfficersTable
            officers={allOfficers.map(o => ({ ...o, createdAt: o.createdAt.toISOString() }))}
            showAll
          />
        </CardContent>
      </Card>
    </div>
  );
}
