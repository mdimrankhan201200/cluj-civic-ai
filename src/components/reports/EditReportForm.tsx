"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AiAnalysisResult } from "@/types";
import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

const ISSUE_TYPES = Object.entries(ISSUE_TYPE_META).map(([value, meta]) => ({ value, ...meta }));

const SEVERITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const schema = z.object({
  issueType: z.string().min(1),
  severity: z.string().min(1),
  description: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  reportId: string;
  defaultIssueType: string;
  defaultSeverity: string;
  defaultDescription?: string;
  defaultImageUrl: string;
};

export function EditReportForm({
  reportId,
  defaultIssueType,
  defaultSeverity,
  defaultDescription,
  defaultImageUrl,
}: Props) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [aiSummary, setAiSummary] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      issueType: defaultIssueType,
      severity: defaultSeverity,
      description: defaultDescription,
    },
  });

  const issueType = watch("issueType");
  const severity = watch("severity");

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { imageUrl: string; aiResult: AiAnalysisResult };
      setImageUrl(data.imageUrl);
      setAiSummary(data.aiResult.summary);
      setValue("issueType", data.aiResult.issueType);
      setValue("severity", data.aiResult.severity);
      setValue("description", data.aiResult.summary);
      toast.success("Image uploaded — AI has re-analysed the issue");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    const res = await fetch(`/api/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueType: data.issueType,
        severity: data.severity,
        description: data.description,
        imageUrl: imageUrl !== defaultImageUrl ? imageUrl : undefined,
        aiSummary: aiSummary,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Failed to update report");
      return;
    }
    toast.success("Report updated successfully");
    router.push(`/reports/${reportId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Image */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="relative rounded-lg overflow-hidden border border-border h-48 bg-muted">
              <Image src={imageUrl} alt="Report" fill className="object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                  <p className="text-white text-sm">Uploading &amp; analysing…</p>
                </div>
              )}
              {!uploading && (
                <label className="absolute bottom-2 right-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Change photo
                  </span>
                </label>
              )}
            </div>
            {imageUrl !== defaultImageUrl && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <Sparkles className="h-3.5 w-3.5" />
                New photo uploaded — AI fields updated automatically
                <button
                  type="button"
                  onClick={() => { setImageUrl(defaultImageUrl); setAiSummary(undefined); }}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Issue type */}
          <div className="space-y-1.5">
            <Label>Issue type</Label>
            <Select value={issueType} onValueChange={(v) => v && setValue("issueType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.issueType && <p className="text-xs text-destructive">{errors.issueType.message}</p>}
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => v && setValue("severity", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.severity && <p className="text-xs text-destructive">{errors.severity.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the issue in detail…"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || uploading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
