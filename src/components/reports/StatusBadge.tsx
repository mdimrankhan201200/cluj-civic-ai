"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const CLASSES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700 border-gray-200",
  ACCEPTED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  UNDER_REVIEW: "bg-blue-100 text-blue-700 border-blue-200",
  WORK_STARTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
  DELAYED: "bg-orange-100 text-orange-700 border-orange-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = t.statuses[status as keyof typeof t.statuses] ?? status;
  const className = CLASSES[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
