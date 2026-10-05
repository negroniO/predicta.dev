import { adminSuccess, apiError } from "@/app/lib/api";
import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authorizeAdminRequest } from "@/app/lib/admin";
import { parseProjectInput } from "@/app/lib/project-input";
import { readAdminForm, uploadCover, removeNewCover } from "@/app/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  let uploaded: { url: string; path: string } | undefined;
  try {
    const body = await readAdminForm(req);
    const data = parseProjectInput(body);
    const file = body.get("coverImage");
    if (file instanceof File && file.size) uploaded = await uploadCover(file);
    await prisma.project.create({ data: { ...data, coverImageUrl: uploaded?.url ?? null } });
    return adminSuccess(req, "/admin?created=1");
  } catch (error) {
    if (uploaded) await removeNewCover(uploaded.path);
    return apiError(error, "project_mutation");
  }
}
