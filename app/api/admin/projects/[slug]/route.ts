import { adminSuccess, ApiError, apiError } from "@/app/lib/api";
import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authorizeAdminRequest } from "@/app/lib/admin";
import { expectedProjectVersion, parseProjectInput, ProjectInputError } from "@/app/lib/project-input";
import { readAdminForm, uploadCover, removeNewCover } from "@/app/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  const { slug } = await params;
  let uploaded: { url: string; path: string } | undefined;
  try {
    const body = await readAdminForm(req);
    const action = body.get("_action") || "update";
    const where = { slug, updatedAt: expectedProjectVersion(body) };
    let count: number;
    if (action === "delete") {
      ({ count } = await prisma.project.deleteMany({ where }));
    } else if (action === "feature") {
      const featured = body.get("featured");
      if (featured !== "true" && featured !== "false") throw new ProjectInputError("Invalid featured value");
      ({ count } = await prisma.project.updateMany({ where, data: { featured: featured === "true" } }));
    } else if (action === "reorder") {
      const value = body.get("sortOrder");
      if (typeof value !== "string" || !/^\d+$/.test(value)) throw new ProjectInputError("Invalid sort order");
      const sortOrder = Number(value);
      if (!Number.isSafeInteger(sortOrder) || sortOrder > 2_000_000_000) throw new ProjectInputError("Invalid sort order");
      ({ count } = await prisma.project.updateMany({ where, data: { sortOrder } }));
    } else if (action === "update") {
      const data = parseProjectInput(body);
      const file = body.get("coverImage");
      if (file instanceof File && file.size) uploaded = await uploadCover(file);
      ({ count } = await prisma.project.updateMany({ where, data: { ...data, ...(uploaded ? { coverImageUrl: uploaded.url } : {}) } }));
    } else {
      throw new ProjectInputError("Unknown project action");
    }
    if (count !== 1) {
      throw new ApiError("stale_project", 409, "This project changed or was deleted. Reload before saving.");
    }
    return adminSuccess(req, `/admin?${action === "delete" ? "deleted" : "updated"}=1`);
  } catch (error) {
    if (uploaded) await removeNewCover(uploaded.path);
    return apiError(error, "project_mutation");
  }
}
