"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { MapPin, Calendar, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { DeleteReportButton } from "@/components/reports/DeleteReportButton";
import { NON_DELETABLE_STATUSES } from "@/lib/report-constants";
import { IssueTypeBadge } from "@/components/reports/IssueTypeBadge";

type Props = {
  report: {
    id: string;
    issueType: string;
    severity: string;
    status: string;
    address: string | null;
    latitude: number;
    longitude: number;
    imageUrl: string;
    aiSummary: string | null;
    createdAt: Date | string;
  };
  href?: string;
  canDelete?: boolean;
};

export function ReportCard({ report, href, canDelete }: Props) {
  const { t, locale } = useLanguage();
  const link = href ?? `/reports/${report.id}`;
  const dateLocale = locale === "ro" ? ro : enUS;
  const issueLabel = t.issueTypes[report.issueType as keyof typeof t.issueTypes] ?? report.issueType;
  const isDeletable = canDelete && !NON_DELETABLE_STATUSES.has(report.status);

  return (
    <div className="relative group">
      <Link href={link}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-0">
            <div className="relative h-36 overflow-hidden rounded-t-lg bg-muted">
              <Image
                src={report.imageUrl}
                alt={issueLabel}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <IssueTypeBadge issueType={report.issueType} />
                <StatusBadge status={report.status} />
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={report.severity} />
              </div>
              {report.address && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {formatDistanceToNow(new Date(report.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {isDeletable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
          <Link
            href={`/reports/${report.id}/edit`}
            className="p-1.5 rounded-md bg-black/50 hover:bg-blue-500/80 text-white transition-colors"
            title="Edit report"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <DeleteReportButton reportId={report.id} variant="icon" />
        </div>
      )}
    </div>
  );
}
