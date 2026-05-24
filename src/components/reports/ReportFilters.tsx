"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

const STATUS_FILTERS = [
  { key: "",           label: "All" },
  { key: "pending",    label: "Pending" },
  { key: "inprogress", label: "In Progress" },
  { key: "resolved",   label: "Resolved" },
];

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter   = searchParams.get("filter") ?? "";
  const activeCategory = searchParams.get("category") ?? "";

  function buildUrl(filter: string, category: string) {
    const params = new URLSearchParams();
    if (filter)   params.set("filter", filter);
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `/reports?${qs}` : "/reports";
  }

  function setFilter(filter: string) {
    router.push(buildUrl(filter, activeCategory));
  }

  function setCategory(category: string) {
    router.push(buildUrl(activeFilter, category));
  }

  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setCategory("")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            activeCategory === ""
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground bg-transparent"
          }`}
        >
          All categories
        </button>
        {Object.entries(ISSUE_TYPE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => setCategory(isActive ? "" : key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? `${meta.bg} ${meta.color} border-current`
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? meta.color : ""}`} />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
