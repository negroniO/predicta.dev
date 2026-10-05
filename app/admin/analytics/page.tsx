import { referrerLabel } from "@/app/lib/export-format";
import { requireAdminPage } from "@/app/lib/admin";
// app/admin/analytics/page.tsx
import { analyticsRange, getAnalytics } from "@/app/lib/analytics";
import Link from "next/link";
import AdminTabs from "../components/AdminTabs";

export const metadata = {
  title: "Analytics",
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
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminPage("/admin/analytics");
  const params = (await searchParams) ?? {};
  const startParam = typeof params.start === "string" ? params.start : null;
  const endParam = typeof params.end === "string" ? params.end : null;

  const { start, end } = analyticsRange(startParam, endParam);
  const { totalViews, uniqueVisitors, recentViews, dailyViews, deviceCounts, referrerCounts, contactClicks, reactionCounts, projects } = await getAnalytics(start, end);
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
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayLabels.push(key);
    byDay.set(key, 0);
  }

  dailyViews.forEach((row) => byDay.set(row.day.toISOString().slice(0, 10), Number(row.views)));
  deviceCounts.forEach((row) => deviceBuckets.set(row.deviceType ?? "Unknown", row._count._all));
  referrerCounts.forEach((row) => {
    const ref = referrerLabel(row.referrer);
    referrerBuckets.set(ref, (referrerBuckets.get(ref) ?? 0) + row._count._all);
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
            Views in selected period
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-50">
            {totalViews}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Unique visitor IDs in selected period
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
            Top referrers (100 most frequent stored URLs)
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

            {referrerBuckets.size === 0 && (
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

            {deviceBuckets.size === 0 && (
              <p className="text-[11px] text-slate-500">
                No device info tracked yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Contact clicks */}
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 space-y-3 text-xs">
        <h2 className="text-sm font-semibold text-slate-100">Contact clicks (top 50 in selected period)</h2>
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
          Dates use UTC. Views use browser-generated visitor IDs; reactions use a cookie.
          Reaction totals count current reactions last changed within this period.
        </p>
      </div>
    </div>
  );
}
