import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: 1 })
  : null;

/**
 * Simple fixed-window rate limit using Redis.
 * Returns true if under the limit, false if exceeded.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (!redis) return true; // if Redis is not configured, skip limiting

  const windowKey = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }
  return count <= limit;
}
