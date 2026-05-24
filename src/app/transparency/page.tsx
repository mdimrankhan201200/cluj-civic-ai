import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import Link from "next/link";
import { MapPin, Shield, CheckCircle, Clock, Wrench, AlertTriangle, Megaphone } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import { cookies } from "next/headers";
import { getTranslations } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TransparencyAnimated } from "@/components/transparency/TransparencyAnimated";

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value;
  return locale === "en" || locale === "ro" ? locale : "ro";
}

export default async function TransparencyPage() {
  const locale = await getLocale();
  const t = getTranslations(locale);
  const dateLocale = locale === "ro" ? roLocale : undefined;

  const activeStatuses = [
    ReportStatus.ACCEPTED,
    ReportStatus.UNDER_REVIEW,
    ReportStatus.WORK_STARTED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.DELAYED,
  ];
  const completedStatuses = [
    ReportStatus.COMPLETED,
    ReportStatus.CLOSED,
    ReportStatus.RESOLVED,
  ];

  const [activeReports, completedReports, announcements] = await Promise.all([
    prisma.report.findMany({
      where: { status: { in: activeStatuses } },
      include: {
        governmentActions: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { officer: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.report.findMany({
      where: { status: { in: completedStatuses } },
      include: {
        governmentActions: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { officer: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.announcement.findMany({
      include: { officer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = {
    active: activeReports.length,
    completed: completedReports.length,
    delayed: activeReports.filter((r) => r.status === "DELAYED").length,
    workInProgress: activeReports.filter((r) =>
      ["WORK_STARTED", "IN_PROGRESS"].includes(r.status)
    ).length,
  };

  const statsCards = [
    { label: t.transparency.activeWorks, value: stats.active, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: "Wrench" },
    { label: "Works in progress", value: stats.workInProgress, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "Clock" },
    { label: t.transparency.completedWorks, value: stats.completed, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: "CheckCircle" },
    { label: t.statuses.DELAYED, value: stats.delayed, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: "AlertTriangle" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-blue-700">
            <MapPin className="h-5 w-5" />
            <span>Cluj Civic AI</span>
          </Link>
          <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
            {t.nav.login}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <TransparencyAnimated
          statsCards={statsCards}
          activeReports={activeReports.map((r) => ({
            id: r.id,
            status: r.status,
            severity: r.severity,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            aiSummary: r.aiSummary,
            updatedAt: r.updatedAt.toISOString(),
            latestAction: r.governmentActions[0]
              ? {
                  actionTaken: r.governmentActions[0].actionTaken,
                  progress: r.governmentActions[0].progress,
                  assignedTeam: r.governmentActions[0].assignedTeam,
                  estimatedCompletion: r.governmentActions[0].estimatedCompletion?.toISOString() ?? null,
                  delayReason: r.governmentActions[0].delayReason,
                  createdAt: r.governmentActions[0].createdAt.toISOString(),
                }
              : null,
          }))}
          completedReports={completedReports.map((r) => ({
            id: r.id,
            status: r.status,
            severity: r.severity,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            aiSummary: r.aiSummary,
            updatedAt: r.updatedAt.toISOString(),
          }))}
          announcements={announcements.map((a) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            officerName: a.officer.name,
            createdAt: a.createdAt.toISOString(),
          }))}
          rights={t.transparency.rights}
          labels={{
            title: t.transparency.title,
            subtitle: t.transparency.subtitle,
            progress: t.transparency.progress,
            team: t.transparency.team,
            estimatedCompletion: t.transparency.estimatedCompletion,
            lastUpdate: t.transparency.lastUpdate,
            delayReason: t.transparency.delayReason,
            activeWorks: t.transparency.activeWorks,
            completedWorks: t.transparency.completedWorks,
            noActive: t.transparency.noActive,
            citizenRights: t.transparency.citizenRights,
          }}
          locale={locale}
        />
      </main>
    </div>
  );
}
