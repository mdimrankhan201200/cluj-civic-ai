"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  FileText,
  Map,
  PlusCircle,
  BarChart3,
  ClipboardList,
  Eye,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const isGov =
    session?.user?.role === "GOVERNMENT_OFFICER" ||
    session?.user?.role === "ADMIN";
  const isAdmin = session?.user?.role === "ADMIN";

  const citizenLinks = [
    { href: "/dashboard", label: t.sidebar.dashboard, icon: LayoutDashboard },
    { href: "/reports/new", label: t.sidebar.reportProblem, icon: PlusCircle },
    { href: "/reports", label: t.sidebar.myReports, icon: FileText },
    { href: "/map", label: t.sidebar.map, icon: Map },
    { href: "/transparency", label: t.sidebar.transparency, icon: Eye },
  ];

  const govLinks = [
    { href: "/gov", label: t.sidebar.dashboard, icon: BarChart3 },
    { href: "/gov/reports", label: t.sidebar.allReports, icon: ClipboardList },
    { href: "/gov/announcements", label: "Announcements", icon: Megaphone },
    { href: "/map", label: t.sidebar.map, icon: Map },
    { href: "/transparency", label: t.sidebar.transparency, icon: Eye },
  ];

  if (isAdmin) {
    govLinks.push({ href: "/admin", label: t.sidebar.adminPanel, icon: ShieldCheck });
  }

  const links = isGov ? govLinks : citizenLinks;

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-muted/20 min-h-full">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {isGov && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {t.sidebar.loggedAs}{" "}
            <span className="font-medium text-blue-700">
              {session?.user?.role === "ADMIN" ? t.sidebar.admin : t.sidebar.officer}
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
