import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// DEV ONLY: log which DB host Prisma sees
if (process.env.NODE_ENV === "development") {
  try {
    const url = new URL(process.env.DATABASE_URL || "");
    console.log(
      "[prisma] Using DB host:",
      url.hostname,
      "port:",
      url.port
    );
  } catch {
    console.log("[prisma] DATABASE_URL is not a valid URL");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
