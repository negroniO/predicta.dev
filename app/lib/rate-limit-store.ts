export type LimitResult = { allowed: boolean; retryAfter: number };

// Counter and expiry are one atomic operation, including repair of a missing TTL.
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
  ttl = tonumber(ARGV[2])
end
return {count, ttl}
`;

export function createMemoryLimiter(maxKeys = 10_000, now = Date.now) {
  const entries = new Map<string, { count: number; expires: number }>();
  return (key: string, limit: number, seconds: number): LimitResult => {
    const time = now();
    let entry = entries.get(key);
    if (!entry || entry.expires <= time) {
      if (!entry && entries.size >= maxKeys) {
        for (const [id, item] of entries) if (item.expires <= time) entries.delete(id);
        if (entries.size >= maxKeys) return { allowed: false, retryAfter: seconds };
      }
      entry = { count: 0, expires: time + seconds * 1000 };
      entries.set(key, entry);
    }
    entry.count++;
    return { allowed: entry.count <= limit, retryAfter: Math.max(1, Math.ceil((entry.expires - time) / 1000)) };
  };
}
