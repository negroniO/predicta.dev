import { trackClick } from "@/app/lib/track-click";

export const runtime = "nodejs";

export async function POST(req: Request) { return trackClick(req); }
