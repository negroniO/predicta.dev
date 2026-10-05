import { apiError, ApiError } from "./api";
import { getServerSession, type Session } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { adminGitHubIds } from "./admin-policy";
import { prisma } from "./prisma";

async function hasAdminAccount(session: Session): Promise<boolean> {
  if (!session.user?.id) return false;
  // Re-check persisted ownership, including sessions issued before the allowlist.
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github", providerAccountId: { in: adminGitHubIds() } },
    select: { id: true },
  });
  return account !== null;
}

export async function requireAdminPage(callbackUrl: string): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (!(await hasAdminAccount(session))) notFound();
  return session;
}

export function isSameOriginMutation(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const expected = new URL(process.env.NEXTAUTH_URL || req.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

export async function authorizeAdminRequest(req: Request): Promise<NextResponse | null> {
  try {
  const session = await getServerSession(authOptions);
  if (!session) return apiError(new ApiError("unauthorized", 401), "admin_auth");
  if (!(await hasAdminAccount(session))) return apiError(new ApiError("forbidden", 403), "admin_auth");
  if (!["GET", "HEAD"].includes(req.method) && !isSameOriginMutation(req)) {
    return apiError(new ApiError("invalid_origin", 403), "admin_auth");
  }
  return null;
  } catch (error) { return apiError(error, "admin_auth"); }
}
