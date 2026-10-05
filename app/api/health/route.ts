export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Liveness must remain independent of database or Redis outages.
export function GET() {
  return Response.json({ status: "alive" }, { headers: { "Cache-Control": "no-store" } });
}
