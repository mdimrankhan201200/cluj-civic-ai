"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const ReportsMap = dynamic(
  () => import("@/components/map/ReportsMap").then((m) => m.ReportsMap),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> }
);

export default function MapPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">{t.map.title}</h1>
        <p className="text-muted-foreground text-sm">{t.map.subtitle}</p>
      </div>
      <div className="flex-1 min-h-[500px]">
        <ReportsMap />
      </div>
    </div>
  );
}
