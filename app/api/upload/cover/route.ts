import { apiError } from "@/app/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/app/lib/admin";
import { readAdminForm, uploadCover, UploadError } from "@/app/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const body = await readAdminForm(req);
    const file = body.get("file");
    if (!(file instanceof File)) throw new UploadError("No file uploaded");
    const { url } = await uploadCover(file);
    return NextResponse.json({ url });
  } catch (error) {
    return apiError(error, "cover_upload");
  }
}
