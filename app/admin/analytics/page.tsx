// app/admin/analytics/page.tsx
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Analytics | predicta.dev",
  description:
    "Lightweight analytics for project views on predicta.dev – views, referrers, devices.",
};

function formatDate(value: Date) {
  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminAnalyticsPage() {
  const [
    totalViewsAgg,
    uniqueVisitorsGroups,
    recentViews,
    topReferrers,
    topDevices,
  ] = await Promise.all([
    // Total views
    prisma.projectView.aggregate({
      _count: { _all: true },
    }),

    // Unique visitors (group by visitorId)
    prisma.projectView.groupBy({
      by: ["visitorId"],
      where: { visitorId: { not: null } },
    }),

    // Recent views
    prisma.projectView.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        project: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    }),

    // Top referrers
    prisma.projectView.groupBy({
      by: ["referrer"],
      where: { referrer: { not: null } },
      _count: { referrer: true },
      orderBy: {
        _count: {
          // sort by count of non-null referrer values
          referrer: "desc",
        },
      },
      take: 10,
    }),

    // Top devices
    prisma.projectView.groupBy({
      by: ["deviceType"],
      _count: { deviceType: true },
      orderBy: {
        _count: {
          deviceType: "desc",
        },
      },
      take: 10,
    }),
  ]);

  const totalViews = totalViewsAgg._count._all;
  const uniqueVisitors = uniqueVisitorsGroups.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
          Admin
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Lightweight, privacy-friendly analytics powered by your{" "}
          <code className="text-xs bg-slate-900/70 px-1 rounded">
            ProjectView
          </code>{" "}
          table.
        </p>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Total views
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-50">
            {totalViews}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Unique visitors
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-50">
            {uniqueVisitors}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Recent views (last 20 rows)
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-50">
            {recentViews.length}
          </p>
        </div>
      </section>

      {/* Three columns: recent / referrers / devices */}
      <section className="grid gap-6 md:grid-cols-3 text-xs">
        {/* Recent views */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Recent views
          </h2>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {recentViews.map((v) => (
              <div
                key={v.id}
                className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex justify-between gap-2">
                  <Link
                    href={`/projects/${v.project.slug}`}
                    className="text-slate-200 hover:text-cyan-300 underline underline-offset-2"
                  >
                    {v.project.title}
                  </Link>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(v.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 break-all">
                  {v.path}
                </p>
              </div>
            ))}

            {recentViews.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No views tracked yet.
              </p>
            )}
          </div>
        </div>

        {/* Top referrers */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Top referrers
          </h2>
          <div className="space-y-2">
            {topReferrers.map((r, idx) => (
              <div
                key={r.referrer ?? `ref-${idx}`}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <span className="truncate text-slate-300">
                  {r.referrer ?? "(direct / none)"}
                </span>
                <span className="text-slate-200 font-medium">
                  {r._count.referrer}
                </span>
              </div>
            ))}

            {topReferrers.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No referrer data yet.
              </p>
            )}
          </div>
        </div>

        {/* Top devices */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Device breakdown
          </h2>
          <div className="space-y-2">
            {topDevices.map((d) => (
              <div
                key={d.deviceType ?? "unknown"}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <span className="text-slate-300">
                  {d.deviceType ?? "unknown"}
                </span>
                <span className="text-slate-200 font-medium">
                  {d._count.deviceType}
                </span>
              </div>
            ))}

            {topDevices.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No device info tracked yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="pt-4 text-[11px] text-slate-500">
        <p>
          All data is anonymous and stored in your own Postgres via Prisma. No
          cookies, no third-party trackers.
        </p>
      </div>
    </div>
  );
}
