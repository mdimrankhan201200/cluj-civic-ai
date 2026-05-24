"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow, format } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import {
  CheckCircle,
  Clock,
  Wrench,
  AlertTriangle,
  XCircle,
  PlayCircle,
  Eye,
  ThumbsUp,
  Archive,
} from "lucide-react";

type GovernmentAction = {
  id: string;
  actionTaken: string;
  assignedTeam?: string | null;
  progress?: number | null;
  estimatedCompletion?: string | null;
  delayReason?: string | null;
  isPublic: boolean;
  createdAt: string;
  officer: { id: string; name: string };
};

type TimelineEvent = {
  id: string;
  type: "report_created" | "gov_action";
  date: string;
  action?: GovernmentAction;
};

type Props = {
  createdAt: string;
  status: string;
  actions: GovernmentAction[];
};

const STATUS_ICONS: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  PENDING: { icon: Clock, color: "text-gray-600", bg: "bg-gray-100" },
  ACCEPTED: { icon: ThumbsUp, color: "text-cyan-600", bg: "bg-cyan-100" },
  UNDER_REVIEW: { icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
  WORK_STARTED: { icon: PlayCircle, color: "text-indigo-600", bg: "bg-indigo-100" },
  IN_PROGRESS: { icon: Wrench, color: "text-purple-600", bg: "bg-purple-100" },
  DELAYED: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
  COMPLETED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  CLOSED: { icon: Archive, color: "text-slate-600", bg: "bg-slate-100" },
  RESOLVED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
};

export function ReportTimeline({ createdAt, status, actions }: Props) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "ro" ? ro : enUS;

  const IconConfig = STATUS_ICONS[status] ?? STATUS_ICONS.PENDING;

  return (
    <div className="space-y-4">
      {/* Initial event */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </div>
          {actions.length > 0 && <div className="w-0.5 flex-1 bg-border mt-2" />}
        </div>
        <div className="pb-4 flex-1">
          <p className="text-sm font-medium">Raport trimis</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: dateLocale })}
          </p>
        </div>
      </div>

      {/* Government actions */}
      {actions.map((action, idx) => {
        const isLast = idx === actions.length - 1;
        const ActionIcon = STATUS_ICONS.IN_PROGRESS;
        return (
          <div key={action.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isLast ? IconConfig.bg : "bg-blue-50"}`}>
                {isLast ? (
                  <IconConfig.icon className={`h-4 w-4 ${IconConfig.color}`} />
                ) : (
                  <ActionIcon.icon className="h-4 w-4 text-blue-500" />
                )}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
            </div>
            <div className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{action.actionTaken}</p>
                {action.progress != null && (
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {action.progress}%
                  </span>
                )}
              </div>

              {action.assignedTeam && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t.reports.detail.team} {action.assignedTeam}
                </p>
              )}

              {action.progress != null && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${action.progress}%` }}
                  />
                </div>
              )}

              {action.estimatedCompletion && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t.transparency.estimatedCompletion}: {format(new Date(action.estimatedCompletion), "dd MMM yyyy", { locale: dateLocale })}
                </p>
              )}

              {action.delayReason && (
                <div className="mt-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                  {t.transparency.delayReason}: {action.delayReason}
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {action.officer.name} · {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true, locale: dateLocale })}
                </p>
                {!action.isPublic && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">intern</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
