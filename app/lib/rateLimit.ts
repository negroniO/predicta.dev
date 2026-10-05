import { operationalLog } from "./operational-log";
import Redis from "ioredis";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { ApiError } from "./api";
import { createMemoryLimiter, RATE_LIMIT_SCRIPT, type LimitResult } from "./rate-limit-store";

const memory = createMemoryLimiter();
let redis: Redis | undefined;
let connecting: Promise<unknown> | undefined;
let unavailableUntil = 0;

export function rateLimitIdentity(req: Request): string {
  // Trust only a header explicitly selected for a proxy that overwrites it.
  const header = process.env.RATE_LIMIT_IP_HEADER?.toLowerCase();
  const candidate = header ? req.headers.get(header)?.split(",")[0].trim() : undefined;
  const address = candidate && candidate.length <= 45 && isIP(candidate) ? candidate : "shared";
  return createHash("sha256").update(address).digest("hex");
}

export async function rateLimit(key: string, limit: number, seconds: number): Promise<LimitResult> {
  const backend = process.env.RATE_LIMIT_BACKEND || (process.env.NODE_ENV === "production" ? "redis" : "memory");
  if (backend === "memory") return memory(key, limit, seconds);
  if (backend !== "redis" || !process.env.REDIS_URL || Date.now() < unavailableUntil) {
    throw new ApiError("rate_limit_unavailable", 503, "Please try again shortly", 30);
  }
  try {
    if (!redis) {
      redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 0,
        connectTimeout: 1000, commandTimeout: 1500, retryStrategy: () => null,
      });
      redis.on("error", () => { /* Error responses are handled below without logging secrets. */ });
      connecting = redis.connect();
    }
    await connecting;
    const result = await redis.eval(RATE_LIMIT_SCRIPT, 1, `predicta:rate:${key}`, limit, seconds * 1000) as [number, number];
    return { allowed: result[0] <= limit, retryAfter: Math.max(1, Math.ceil(result[1] / 1000)) };
  } catch {
    redis?.disconnect();
    redis = undefined;
    connecting = undefined;
    unavailableUntil = Date.now() + 30_000;
    operationalLog("error", "rate_limit_unavailable");
    throw new ApiError("rate_limit_unavailable", 503, "Please try again shortly", 30);
  }
}

export async function enforceRateLimit(req: Request, scope: string, limit: number, seconds = 60): Promise<void> {
  const result = await rateLimit(`${scope}:${rateLimitIdentity(req)}`, limit, seconds);
  if (!result.allowed) throw new ApiError("rate_limited", 429, "Too many requests", result.retryAfter);
}
