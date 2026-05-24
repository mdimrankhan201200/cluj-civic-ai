"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/reports/ImageUploader";
import { AiAnalysisResult } from "@/components/reports/AiAnalysisResult";
import type { AiAnalysisResult as AiResult } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

type FormState = {
  imageUrl: string;
  aiResult: AiResult | null;
  issueType: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  description: string;
};

export function ReportForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    imageUrl: "",
    aiResult: null,
    issueType: "",
    severity: "",
    latitude: null,
    longitude: null,
    address: "",
    description: "",
  });

  const ISSUE_TYPES = Object.entries(t.issueTypes).map(([value, label]) => ({ value, label }));
  const SEVERITIES = Object.entries(t.severities).map(([value, label]) => ({ value, label }));

  function handleUploadComplete(result: { imageUrl: string; aiResult: AiResult }) {
    setForm((f) => ({
      ...f,
      imageUrl: result.imageUrl,
      aiResult: result.aiResult,
      issueType: result.aiResult.issueType,
      severity: result.aiResult.severity,
      description: result.aiResult.summary,
    }));
    setStep(1);
  }

  function handleLocationChange(lat: number, lng: number, address?: string) {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: address ?? f.address }));
  }

  async function handleSubmit() {
    if (!form.latitude || !form.longitude) {
      toast.error(t.reportForm.locationRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          description: form.description,
          latitude: form.latitude,
          longitude: form.longitude,
          address: form.address || undefined,
          issueType: form.issueType,
          severity: form.severity,
          aiSummary: form.aiResult?.summary,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error");
      }

      toast.success(t.reportForm.success);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitles = [t.reportForm.step1, t.reportForm.step2, t.reportForm.step3, t.reportForm.step4];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        {t.reportForm.steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step
                  ? "bg-blue-600 text-white"
                  : i === step
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? "font-medium" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < t.reportForm.steps.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${i < step ? "bg-blue-600" : "bg-border"}`} style={{ width: 20 }} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{stepTitles[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <ImageUploader
                onUploadComplete={handleUploadComplete}
                onUploadingChange={setUploading}
              />
              {form.aiResult && <AiAnalysisResult result={form.aiResult} />}
            </div>
          )}

          {step === 1 && (
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onLocationChange={handleLocationChange}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.reportForm.issueType}</Label>
                <Select value={form.issueType} onValueChange={(v) => v && setForm((f) => ({ ...f, issueType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.reportForm.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((item) => {
                      const meta = ISSUE_TYPE_META[item.value];
                      const Icon = meta?.icon;
                      return (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className={`h-4 w-4 ${meta.color}`} />}
                            {item.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.reportForm.severity}</Label>
                <Select value={form.severity} onValueChange={(v) => v && setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.reportForm.selectSeverity} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.reportForm.description}</Label>
                <Textarea
                  placeholder={t.reportForm.descPlaceholder}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Report" className="w-full max-h-48 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.reportForm.reviewType}</p>
                  <p className="font-medium">
                    {t.issueTypes[form.issueType as keyof typeof t.issueTypes] ?? form.issueType}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.reportForm.reviewSeverity}</p>
                  <Badge variant="outline">
                    {t.severities[form.severity as keyof typeof t.severities] ?? form.severity}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t.reportForm.reviewLocation}</p>
                  <p className="font-medium text-xs">
                    {form.address || `${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}`}
                  </p>
                </div>
                {form.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t.reportForm.reviewDescription}</p>
                    <p className="text-xs">{form.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.reportForm.back}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 0 && (!form.imageUrl || uploading)) ||
                  (step === 1 && (!form.latitude || !form.longitude)) ||
                  (step === 2 && (!form.issueType || !form.severity))
                }
              >
                {t.reportForm.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.reportForm.submitting}
                  </>
                ) : (
                  t.reportForm.submit
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
