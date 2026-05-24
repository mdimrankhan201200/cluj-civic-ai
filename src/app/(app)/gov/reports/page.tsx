import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { SeverityBadge } from "@/components/reports/SeverityBadge";
import { StatusBadge } from "@/components/reports/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ro, enUS } from "date-fns/locale";
import type { Severity, ReportStatus } from "@prisma/client";
import { getLocale } from "@/lib/locale";
import { getTranslations } from "@/lib/i18n";

export default async function GovReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string; page?: string }>;
}) {
  const session = await auth();
  if (
    session?.user?.role !== "GOVERNMENT_OFFICER" &&
    session?.user?.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const locale = await getLocale();
  const t = getTranslations(locale);
  const dateLocale = locale === "ro" ? ro : enUS;

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 20;

  const where = {
    ...(sp.status ? { status: sp.status as ReportStatus } : {}),
    ...(sp.severity ? { severity: sp.severity as Severity } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const tf = t.govReports.filters;

  const filters = [
    { label: tf.all, href: "/gov/reports" },
    { label: tf.critical, href: "/gov/reports?severity=CRITICAL" },
    { label: tf.pending, href: "/gov/reports?status=PENDING" },
    { label: tf.accepted, href: "/gov/reports?status=ACCEPTED" },
    { label: tf.workStarted, href: "/gov/reports?status=WORK_STARTED" },
    { label: tf.inProgress, href: "/gov/reports?status=IN_PROGRESS" },
    { label: tf.delayed, href: "/gov/reports?status=DELAYED" },
    { label: tf.completed, href: "/gov/reports?status=COMPLETED" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t.govReports.title} ({total})
        </h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {filters.map(({ label, href }) => (
          <Link key={label} href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">{t.govReports.cols.img}</TableHead>
              <TableHead>{t.govReports.cols.type}</TableHead>
              <TableHead>{t.govReports.cols.severity}</TableHead>
              <TableHead>{t.govReports.cols.status}</TableHead>
              <TableHead>{t.govReports.cols.citizen}</TableHead>
              <TableHead>{t.govReports.cols.location}</TableHead>
              <TableHead>{t.govReports.cols.date}</TableHead>
              <TableHead className="w-20">{t.govReports.cols.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                    <Image src={r.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {t.issueTypes[r.issueType as keyof typeof t.issueTypes] ?? r.issueType}
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={r.severity} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.user.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                  {r.address ?? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: dateLocale })}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/gov/reports/${r.id}`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    {t.govReports.manage}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {page > 1 && (
            <Link
              href={`/gov/reports?page=${page - 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t.govReports.prev}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {t.govReports.page} {page} {t.govReports.of} {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/gov/reports?page=${page + 1}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t.govReports.next}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
