import { csvCell } from "@/app/lib/export-format";
import { authorizeAdminRequest } from "@/app/lib/admin";
import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { analyticsRange } from "@/app/lib/analytics";
import { apiError, ApiError } from "@/app/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;

  try {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const { start, end } = analyticsRange(startParam, endParam);

  const views = await prisma.projectView.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: {
      createdAt: true,
      path: true,
      referrer: true,
      deviceType: true,
      project: { select: { slug: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10_001,
  });

  if (views.length > 10_000) throw new ApiError("export_too_large", 422, "Select a shorter date range (maximum 10,000 rows)");

  const rows = [
    ["createdAt", "projectSlug", "path", "referrer", "deviceType"].join(","),
    ...views.map((v) =>
      [
        v.createdAt.toISOString(),
        v.project.slug,
        v.path,
        v.referrer,
        v.deviceType,
      ].map(csvCell).join(",")
    ),
  ].join("\r\n");

  return new Response(rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=analytics.csv",
    },
  });
  } catch (error) { return apiError(error, "analytics_export"); }
}
