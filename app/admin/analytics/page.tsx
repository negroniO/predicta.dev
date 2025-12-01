// app/admin/analytics/page.tsx
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import AdminTabs from "../components/AdminTabs";
import { clampDateRange } from "@/app/lib/validation";

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

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ?? {};
  const startParam = typeof params.start === "string" ? params.start : null;
  const endParam = typeof params.end === "string" ? params.end : null;

  let start = startParam
    ? new Date(startParam)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
      })();
  let end = endParam ? new Date(endParam) : new Date();

  if (Number.isNaN(start.getTime())) {
    start.setDate(start.getDate() - 30);
  }
  if (Number.isNaN(end.getTime())) {
    end.setTime(Date.now());
  }
  end.setHours(23, 59, 59, 999);
  ({ start, end } = clampDateRange(start, end, 90));

  const [
    totalViewsAgg,
    uniqueVisitorsGroups,
    recentViews,
    topReferrers,
    topDevices,
    last30,
    contactClicks,
    reactionCounts,
    projects,
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

    // Last 30 days raw to chart
    prisma.projectView.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, deviceType: true, referrer: true },
    }),

    // Contact clicks
    prisma.contactClick.groupBy({
      by: ["href"],
      _count: { href: true },
      orderBy: { _count: { href: "desc" } },
    }),

    prisma.projectReaction.groupBy({
      by: ["projectId", "kind"],
      _count: { kind: true },
    }),

    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: { id: true, slug: true, title: true },
    }),
  ]);

  const totalViews = totalViewsAgg._count._all;
  const uniqueVisitors = uniqueVisitorsGroups.length;
  const byDay = new Map<string, number>();
  const deviceBuckets = new Map<string, number>();
  const referrerBuckets = new Map<string, number>();
  const reactionBuckets = new Map<number, { like: number; dislike: number }>();

  const dayLabels: string[] = [];
  const dayCount = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayLabels.push(key);
    byDay.set(key, 0);
  }

  last30.forEach((row) => {
    const key = row.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    const device = row.deviceType ?? "Unknown";
    deviceBuckets.set(device, (deviceBuckets.get(device) ?? 0) + 1);
    const ref =
      row.referrer && row.referrer.trim().length > 0
        ? new URL(row.referrer).hostname || row.referrer
        : "direct";
    referrerBuckets.set(ref, (referrerBuckets.get(ref) ?? 0) + 1);
  });

  const maxDay = Math.max(...Array.from(byDay.values()), 1);
  const maxDevice = Math.max(...Array.from(deviceBuckets.values()), 1);
  const maxReferrer = Math.max(...Array.from(referrerBuckets.values()), 1);

  reactionCounts.forEach((r) => {
    const current = reactionBuckets.get(r.projectId) || { like: 0, dislike: 0 };
    if (r.kind === "like") current.like = r._count.kind;
    if (r.kind === "dislike") current.dislike = r._count.kind;
    reactionBuckets.set(r.projectId, current);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <AdminTabs />
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
      <form className="flex flex-wrap gap-2 text-xs items-end border border-slate-700/60 bg-slate-900/60 p-3 rounded-xl">
        <div className="space-y-1">
          <label className="block text-slate-300">Start</label>
          <input
            type="date"
            name="start"
            defaultValue={start.toISOString().slice(0, 10)}
            className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs focus:border-cyan-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-slate-300">End</label>
          <input
            type="date"
            name="end"
            defaultValue={end.toISOString().slice(0, 10)}
            className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs focus:border-cyan-400 outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-cyan-500 px-3 py-1.5 text-slate-950 font-medium hover:bg-cyan-400 transition"
        >
          Apply
        </button>
        <a
          href={`/api/admin/analytics/export?start=${encodeURIComponent(
            start.toISOString()
          )}&end=${encodeURIComponent(end.toISOString())}`}
          className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-cyan-400 transition"
        >
          Export CSV
        </a>
      </form>

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

      {/* Reactions */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">Project reactions</h2>
        <div className="space-y-2">
          {projects.map((p) => {
            const r = reactionBuckets.get(p.id) || { like: 0, dislike: 0 };
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2"
              >
                <Link
                  href={`/projects/${p.slug}`}
                  className="text-slate-200 hover:text-cyan-300 underline underline-offset-2"
                >
                  {p.title}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">
                    👍 {r.like}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/60 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-100">
                    👎 {r.dislike}
                  </span>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <p className="text-[11px] text-slate-500">No projects found.</p>
          )}
        </div>
      </section>

      {/* Time-series charts */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Views – last 30 days
        </h2>
        <div className="flex items-end gap-1 h-28">
          {dayLabels.map((day) => {
            const count = byDay.get(day) ?? 0;
            const height = Math.max(4, (count / maxDay) * 100);
            return (
              <div
                key={day}
                title={`${day}: ${count}`}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-300/80 transition hover:from-cyan-400/60 hover:to-cyan-200/90"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{dayLabels[0]}</span>
          <span>{dayLabels[dayLabels.length - 1]}</span>
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
            {Array.from(referrerBuckets.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([ref, count]) => (
                <div
                  key={ref}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="truncate text-slate-300 flex-1">
                    {ref === "direct" ? "(direct / none)" : ref}
                  </span>
                  <div className="flex items-center gap-2 w-32">
                    <div
                      className="h-2 rounded bg-cyan-400/50"
                      style={{ width: `${(count / maxReferrer) * 100}%` }}
                    />
                    <span className="text-slate-200 font-medium min-w-[24px] text-right">
                      {count}
                    </span>
                  </div>
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
            {Array.from(deviceBuckets.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([device, count]) => (
                <div
                  key={device}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="truncate text-slate-300 flex-1">
                    {device}
                  </span>
                  <div className="flex items-center gap-2 w-32">
                    <div
                      className="h-2 rounded bg-emerald-400/50"
                      style={{ width: `${(count / maxDevice) * 100}%` }}
                    />
                    <span className="text-slate-200 font-medium min-w-[24px] text-right">
                      {count}
                    </span>
                  </div>
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

      {/* Contact clicks */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">Contact clicks</h2>
        <div className="space-y-2">
          {contactClicks.map((c) => (
            <div
              key={c.href}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="truncate text-slate-300">{c.href}</span>
              <span className="text-slate-200 font-medium">{c._count.href}</span>
            </div>
          ))}
          {contactClicks.length === 0 && (
            <p className="text-[11px] text-slate-500">No clicks tracked yet.</p>
          )}
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
