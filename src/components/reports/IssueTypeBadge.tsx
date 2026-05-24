import { ISSUE_TYPE_META } from "@/lib/issue-type-meta";

type Props = {
  issueType: string;
  showLabel?: boolean;
  size?: "sm" | "md";
};

export function IssueTypeBadge({ issueType, showLabel = true, size = "sm" }: Props) {
  const meta = ISSUE_TYPE_META[issueType] ?? ISSUE_TYPE_META.OTHER;
  const Icon = meta.icon;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color} ${textSize}`}
    >
      <Icon className={iconSize} />
      {showLabel && meta.label}
    </span>
  );
}
