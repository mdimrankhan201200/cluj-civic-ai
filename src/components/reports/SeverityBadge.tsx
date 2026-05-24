"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const CLASSES: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const { t } = useLanguage();
  const label = t.severities[severity as keyof typeof t.severities] ?? severity;
  const className = CLASSES[severity] ?? "";
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
