import { authorizeAdminRequest } from "@/app/lib/admin";
import { adminSuccess, apiError, ApiError, positiveInt } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const categoryId = positiveInt((await params).id, 0, 2_000_000_000);
    await prisma.$transaction(async (tx) => {
      if (await tx.project.count({ where: { categoryId } })) throw new ApiError("category_in_use", 409);
      await tx.category.delete({ where: { id: categoryId } });
    }, { isolationLevel: "Serializable" });
    return adminSuccess(req, "/admin?category_deleted=1");
  } catch (error) { return apiError(error, "category_delete"); }
}
