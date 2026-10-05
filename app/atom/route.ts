import { feedResponse } from "@/app/lib/feeds";

export const runtime = "nodejs";

export async function GET() {
  return feedResponse("atom");
}
