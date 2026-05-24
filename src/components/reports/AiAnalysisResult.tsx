"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertTriangle } from "lucide-react";
import type { AiAnalysisResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

type Props = {
  result: AiAnalysisResult;
};

export function AiAnalysisResult({ result }: Props) {
  const { t } = useLanguage();

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">{t.aiResult.title}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {t.aiResult.confidence}: {result.confidence}%
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {t.issueTypes[result.issueType as keyof typeof t.issueTypes] ?? result.issueType}
          </Badge>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[result.severity] ?? ""}`}
          >
            {t.aiResult.severity}: {t.severities[result.severity as keyof typeof t.severities] ?? result.severity}
          </span>
        </div>

        <p className="text-sm text-foreground">{result.summary}</p>

        {result.additionalNotes && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
            <p>{result.additionalNotes}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">{t.aiResult.adjust}</p>
      </CardContent>
    </Card>
  );
}
