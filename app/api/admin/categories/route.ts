import { authorizeAdminRequest } from "@/app/lib/admin";
import { adminSuccess, apiError } from "@/app/lib/api";
import { categoryInput } from "@/app/lib/admin-input";
import { readAdminForm } from "@/app/lib/uploads";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    await prisma.category.create({ data: categoryInput(await readAdminForm(req)) });
    return adminSuccess(req, "/admin?category_created=1");
  } catch (error) { return apiError(error, "category_create"); }
}
