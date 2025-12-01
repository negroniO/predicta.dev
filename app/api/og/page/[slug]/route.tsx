import { ImageResponse } from "next/og";
import { prisma } from "@/app/lib/prisma";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, status: "published" },
    select: { title: true, excerpt: true },
  });

  const title = page?.title ?? "predicta.dev";
  const subtitle =
    page?.excerpt ??
    "Data, finance analytics, and ML projects by George Iordanous.";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0f172a 100%)",
          color: "#e2e8f0",
          padding: "48px",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#22d3ee",
              fontSize: 20,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            predicta.dev
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid rgba(226,232,240,0.3)",
                color: "#e2e8f0",
                fontSize: 14,
              }}
            >
              Page
            </span>
          </div>

          <h1
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              margin: 0,
              color: "#f8fafc",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 28,
              margin: 0,
              color: "rgba(226,232,240,0.85)",
              maxWidth: "960px",
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#94a3b8",
              fontSize: 18,
            }}
          >
            <span>Data • Finance • Analytics</span>
            <span>George Iordanous</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
