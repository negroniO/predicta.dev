import { ImageResponse } from "next/og";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const alt = "predicta.dev project";
export const size = {
  width: 1200,
  height: 630,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      title: true,
      subtitle: true,
      category: { select: { name: true } },
    },
  });

  const title = project?.title ?? "predicta.dev";
  const subtitle =
    project?.subtitle ??
    "Data, finance analytics, and ML projects by George Iordanous.";
  const category = project?.category?.name ?? "";

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              color: "#22d3ee",
              fontSize: 20,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            predicta.dev
            {category && (
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(226,232,240,0.3)",
                  color: "#e2e8f0",
                  fontSize: 14,
                }}
              >
                {category}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          </div>
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
