"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";

type Officer = {
  id: string;
  name: string;
  email: string;
  approvalStatus: string;
  createdAt: string;
};

type Props = {
  officers: Officer[];
  showAll?: boolean;
};

const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

export function PendingOfficersTable({ officers, showAll }: Props) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const dateLocale = locale === "ro" ? ro : enUS;
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "suspend") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(action === "approve" ? t.admin.approved : t.admin.suspended);
      router.refresh();
    } catch {
      toast.error("Eroare");
    } finally {
      setLoadingId(null);
    }
  }

  if (officers.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{t.admin.noPending}</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-3 font-medium">{t.admin.name}</th>
            <th className="text-left px-4 py-3 font-medium">{t.admin.email}</th>
            {showAll && <th className="text-left px-4 py-3 font-medium">{t.admin.statusLabel}</th>}
            <th className="text-left px-4 py-3 font-medium">{t.admin.registeredAt}</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {officers.map((officer) => (
            <tr key={officer.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium">{officer.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{officer.email}</td>
              {showAll && (
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_CLASSES[officer.approvalStatus] ?? ""}>
                    {t.admin.approvalStatuses[officer.approvalStatus as keyof typeof t.admin.approvalStatuses] ?? officer.approvalStatus}
                  </Badge>
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(officer.createdAt), { addSuffix: true, locale: dateLocale })}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {officer.approvalStatus !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      disabled={loadingId === officer.id}
                      onClick={() => handleAction(officer.id, "approve")}
                    >
                      {loadingId === officer.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {t.admin.approve}
                    </Button>
                  )}
                  {officer.approvalStatus !== "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      disabled={loadingId === officer.id}
                      onClick={() => handleAction(officer.id, "suspend")}
                    >
                      {loadingId === officer.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {t.admin.suspend}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
