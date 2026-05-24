"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  reportId: string;
  currentStatus: string;
};

export function StatusUpdateForm({ reportId, currentStatus }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [status, setStatus] = useState(currentStatus);
  const [assignedTeam, setAssignedTeam] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [progress, setProgress] = useState<number | "">(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const STATUSES = [
    { value: "PENDING", label: t.statuses.PENDING },
    { value: "ACCEPTED", label: t.statuses.ACCEPTED },
    { value: "UNDER_REVIEW", label: t.statuses.UNDER_REVIEW },
    { value: "WORK_STARTED", label: t.statuses.WORK_STARTED },
    { value: "IN_PROGRESS", label: t.statuses.IN_PROGRESS },
    { value: "DELAYED", label: t.statuses.DELAYED },
    { value: "COMPLETED", label: t.statuses.COMPLETED },
    { value: "CLOSED", label: t.statuses.CLOSED },
    { value: "REJECTED", label: t.statuses.REJECTED },
  ];

  const showProgress = ["WORK_STARTED", "IN_PROGRESS", "DELAYED", "COMPLETED"].includes(status);
  const showDelayReason = status === "DELAYED";
  const showEstimatedCompletion = ["WORK_STARTED", "IN_PROGRESS", "DELAYED"].includes(status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTaken.trim()) {
      toast.error(t.statusUpdate.actionRequired);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        status,
        assignedTeam: assignedTeam || undefined,
        actionTaken,
        isPublic,
      };

      if (showProgress && progress !== "") body.progress = Number(progress);
      if (showEstimatedCompletion && estimatedCompletion) body.estimatedCompletion = estimatedCompletion;
      if (showDelayReason && delayReason) body.delayReason = delayReason;

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error");
      }

      toast.success(t.statusUpdate.success);
      router.refresh();
      setActionTaken("");
      setAssignedTeam("");
      setProgress(0);
      setEstimatedCompletion("");
      setDelayReason("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.statusUpdate.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.statusUpdate.newStatus}</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.statusUpdate.team}</Label>
            <Input
              placeholder={t.statusUpdate.teamPlaceholder}
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
            />
          </div>

          {showProgress && (
            <div className="space-y-2">
              <Label>{t.statusUpdate.progress} <span className="text-muted-foreground font-normal">({progress}%)</span></Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress === "" ? 0 : progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {showEstimatedCompletion && (
            <div className="space-y-2">
              <Label>{t.statusUpdate.estimatedCompletion}</Label>
              <Input
                type="date"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}

          {showDelayReason && (
            <div className="space-y-2">
              <Label>{t.statusUpdate.delayReason}</Label>
              <Textarea
                placeholder={t.statusUpdate.delayReasonPlaceholder}
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t.statusUpdate.action}</Label>
            <Textarea
              placeholder={t.statusUpdate.actionPlaceholder}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-blue-600"
            />
            <Label htmlFor="isPublic" className="font-normal cursor-pointer">{t.statusUpdate.isPublic}</Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.statusUpdate.submitting}
              </>
            ) : (
              t.statusUpdate.submit
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
