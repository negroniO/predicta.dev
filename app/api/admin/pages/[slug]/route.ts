import { authorizeAdminRequest } from "@/app/lib/admin";
import { adminSuccess, apiError, ApiError } from "@/app/lib/api";
import { formText, pageInput, recordVersion } from "@/app/lib/admin-input";
import { readAdminForm } from "@/app/lib/uploads";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { slug } = await params;
    const form = await readAdminForm(req);
    const action = formText(form, "_action", 20) || "update";
    const where = { slug, updatedAt: recordVersion(form) };
    let count: number;
    if (action === "delete") ({ count } = await prisma.page.deleteMany({ where }));
    else if (action === "update") ({ count } = await prisma.page.updateMany({ where, data: pageInput(form) }));
    else throw new ApiError("invalid_action");
    if (count !== 1) throw new ApiError("stale_record", 409, "Reload before saving; this page changed or was deleted");
    return adminSuccess(req, `/admin/pages?${action === "delete" ? "deleted" : "updated"}=1`);
  } catch (error) { return apiError(error, "page_mutation"); }
}
