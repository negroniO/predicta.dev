import { prisma } from "./prisma";

const DAY = 86_400_000;

export function analyticsRange(startValue?: string | null, endValue?: string | null, now = new Date()) {
  const parse = (value: string | null | undefined, fallback: Date) => {
    const date = value && value.length <= 40 ? new Date(value) : fallback;
    return Number.isNaN(date.getTime()) ? new Date(fallback) : new Date(date);
  };
  let start = parse(startValue, new Date(now.getTime() - 29 * DAY));
  let end = parse(endValue, now);
  if (start > end) [start, end] = [end, start];
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  if (end.getTime() - start.getTime() >= 90 * DAY) start = new Date(end.getTime() - 90 * DAY + 1);
  return { start, end };
}

export async function getAnalytics(start: Date, end: Date) {
  const range = { gte: start, lte: end };
  const [totals, recentViews, dailyViews, deviceCounts, referrerCounts, contactClicks, reactionCounts, projects] = await Promise.all([
    prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitorId") AS visitors
      FROM "ProjectView" WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}`,
    prisma.projectView.findMany({ where: { createdAt: range }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20,
      select: { id: true, createdAt: true, path: true, deviceType: true, project: { select: { slug: true, title: true } } } }),
    prisma.$queryRaw<{ day: Date; views: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
      FROM "ProjectView" WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY 1 ORDER BY 1`,
    prisma.projectView.groupBy({ by: ["deviceType"], where: { createdAt: range }, _count: { _all: true } }),
    prisma.projectView.groupBy({ by: ["referrer"], where: { createdAt: range }, _count: { _all: true },
      orderBy: { _count: { id: "desc" } }, take: 100 }),
    prisma.contactClick.groupBy({ by: ["href"], where: { createdAt: range }, _count: { href: true },
      orderBy: { _count: { href: "desc" } }, take: 50 }),
    prisma.projectReaction.groupBy({ by: ["projectId", "kind"], where: { updatedAt: range }, _count: { kind: true } }),
    prisma.project.findMany({ where: { reactions: { some: { updatedAt: range } } }, orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
      select: { id: true, slug: true, title: true } }),
  ]);
  return { totalViews: Number(totals[0].views), uniqueVisitors: Number(totals[0].visitors), recentViews,
    dailyViews, deviceCounts, referrerCounts, contactClicks, reactionCounts, projects };
}
