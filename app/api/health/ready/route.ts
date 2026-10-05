import { readiness } from "@/app/lib/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { ready } = await readiness();
  return Response.json({ status: ready ? "ready" : "unavailable" }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store", ...(ready ? {} : { "Retry-After": "5" }) },
  });
}
