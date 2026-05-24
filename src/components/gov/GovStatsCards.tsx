"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertOctagon, CheckCircle, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  total: number;
  pending: number;
  critical: number;
  resolvedThisMonth: number;
};

export function GovStatsCards({ total, pending, critical, resolvedThisMonth }: Props) {
  const { t } = useLanguage();

  const stats = [
    { label: t.govStats.total, value: total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t.govStats.pending, value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: t.govStats.critical, value: critical, icon: AlertOctagon, color: "text-red-600", bg: "bg-red-50" },
    { label: t.govStats.resolvedMonth, value: resolvedThisMonth, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
