"use client";

import { Shield, CheckCircle, Wrench, Clock, AlertTriangle, Megaphone } from "lucide-react";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { formatDistanceToNow, format } from "date-fns";
import { ro as roLocale } from "date-fns/locale";
import type { ReportStatus, Severity } from "@prisma/client";

type ActiveReport = {
  id: string;
  status: ReportStatus;
  severity: Severity;
  address: string | null;
  latitude: number;
  longitude: number;
  aiSummary: string | null;
  updatedAt: string;
  latestAction: {
    actionTaken: string;
    progress: number | null;
    assignedTeam: string | null;
    estimatedCompletion: string | null;
    delayReason: string | null;
    createdAt: string;
  } | null;
};

type CompletedReport = {
  id: string;
  status: ReportStatus;
  severity: Severity;
  address: string | null;
  latitude: number;
  longitude: number;
  aiSummary: string | null;
  updatedAt: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  officerName: string;
  createdAt: string;
};

type StatCard = {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
  icon: string;
};

const ICONS: Record<string, React.ElementType> = {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
};

export function TransparencyAnimated({
  statsCards,
  activeReports,
  completedReports,
  announcements,
  rights,
  labels,
  locale,
}: {
  statsCards: StatCard[];
  activeReports: ActiveReport[];
  completedReports: CompletedReport[];
  announcements: Announcement[];
  rights: string[];
  labels: {
    title: string;
    subtitle: string;
    progress: string;
    team: string;
    estimatedCompletion: string;
    lastUpdate: string;
    delayReason: string;
    activeWorks: string;
    completedWorks: string;
    noActive: string;
    citizenRights: string;
  };
  locale: string;
}) {
  const dateLocale = locale === "ro" ? roLocale : undefined;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { width: 0%; }
          to   { width: var(--bar-width); }
        }
        .fade-up { animation: fadeUp 0.5s ease-out both; }
        .progress-bar { animation: growBar 0.8s ease-out both; }
      `}</style>

      {/* Hero */}
      <div className="text-center space-y-3 fade-up" style={{ animationDelay: "0ms" }}>
        <div className="flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">{labels.title}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">{labels.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, color, bg, border, icon }, i) => {
          const Icon = ICONS[icon] ?? Wrench;
          return (
            <div
              key={label}
              className={`border ${border} rounded-lg p-4 flex items-center gap-3 fade-up`}
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 fade-up" style={{ animationDelay: "420ms" }}>
            <Megaphone className="h-5 w-5 text-blue-500" />
            Official Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map((ann, i) => (
              <div
                key={ann.id}
                className="border border-blue-200 bg-blue-50/40 rounded-lg p-4 fade-up"
                style={{ animationDelay: `${500 + i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-blue-900">{ann.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{ann.officerName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Works */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold fade-up" style={{ animationDelay: "480ms" }}>
          {labels.activeWorks}
        </h2>
        {activeReports.length === 0 ? (
          <p className="text-muted-foreground fade-up" style={{ animationDelay: "520ms" }}>
            {labels.noActive}
          </p>
        ) : (
          <div className="grid gap-4">
            {activeReports.map((report, i) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 space-y-3 fade-up"
                style={{ animationDelay: `${540 + i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={report.status} />
                      <SeverityBadge severity={report.severity} />
                    </div>
                    <p className="font-medium text-sm">
                      {report.address ?? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                    </p>
                    {report.aiSummary && (
                      <p className="text-sm text-muted-foreground">{report.aiSummary}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>

                {report.latestAction && (
                  <div className="bg-muted/40 rounded-md p-3 space-y-2">
                    <p className="text-sm">{report.latestAction.actionTaken}</p>

                    {report.latestAction.progress != null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{labels.progress}</span>
                          <span>{report.latestAction.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full progress-bar"
                            style={{
                              "--bar-width": `${report.latestAction.progress}%`,
                              backgroundColor: report.status === "DELAYED" ? "#f97316" : "#3b82f6",
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {report.latestAction.assignedTeam && (
                        <span>{labels.team}: {report.latestAction.assignedTeam}</span>
                      )}
                      {report.latestAction.estimatedCompletion && (
                        <span>
                          {labels.estimatedCompletion}:{" "}
                          {format(new Date(report.latestAction.estimatedCompletion), "dd MMM yyyy", { locale: dateLocale })}
                        </span>
                      )}
                      <span>
                        {labels.lastUpdate}:{" "}
                        {formatDistanceToNow(new Date(report.latestAction.createdAt), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>

                    {report.latestAction.delayReason && (
                      <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                        {labels.delayReason}: {report.latestAction.delayReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Works */}
      {completedReports.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{labels.completedWorks}</h2>
          <div className="grid gap-3">
            {completedReports.map((report, i) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 flex items-start gap-4 opacity-80 fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={report.status} />
                    <SeverityBadge severity={report.severity} />
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {report.address ?? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                  </p>
                  {report.aiSummary && (
                    <p className="text-xs text-muted-foreground mt-0.5">{report.aiSummary}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true, locale: dateLocale })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Citizen Rights */}
      <section className="border border-blue-200 bg-blue-50/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">{labels.citizenRights}</h2>
        </div>
        <ul className="space-y-2">
          {rights.map((right, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-blue-800 fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
              {right}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
