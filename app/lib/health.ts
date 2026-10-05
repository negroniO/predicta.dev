import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { createReadinessProbe } from "./readiness";
import { operationalLog } from "./operational-log";

let database: PrismaClient | undefined;
async function checkDatabase() {
  if (!database) {
    const url = new URL(process.env.DATABASE_URL || "");
    // A lazy, separate one-connection pool bounds probe work independently of
    // long application queries, without changing the application's URL.
    url.searchParams.set("connection_limit", "1");
    url.searchParams.set("connect_timeout", "2");
    url.searchParams.set("pool_timeout", "2");
    url.searchParams.set("socket_timeout", "2");
    database = new PrismaClient({ datasourceUrl: url.href, log: [] });
  }
  await database.$queryRaw`SELECT 1`;
}

async function checkRateLimit() {
  const backend = process.env.RATE_LIMIT_BACKEND || (process.env.NODE_ENV === "production" ? "redis" : "memory");
  if (backend === "memory") return;
  if (backend !== "redis" || !process.env.REDIS_URL) throw new Error("Unavailable");
  const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false,
    maxRetriesPerRequest: 0, connectTimeout: 1000, commandTimeout: 1000, retryStrategy: () => null });
  client.on("error", () => {});
  try { await client.connect(); await client.ping(); }
  finally { client.disconnect(); }
}

export const readiness = createReadinessProbe({ database: checkDatabase, rateLimit: checkRateLimit },
  (result, durationMs) => operationalLog(result.ready ? "info" : "error", "readiness_changed", { ...result, durationMs }));
