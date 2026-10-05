import { randomUUID } from "node:crypto";

type Event = "api_failure" | "readiness_changed" | "rate_limit_unavailable" | "auth_failure" | "cover_cleanup_failed";
type Fields = { operation?: string; requestId?: string; status?: number; durationMs?: number;
  database?: boolean; rateLimit?: boolean; ready?: boolean; category?: string };

export function errorCategory(error: unknown): string {
  const value = error && typeof error === "object" && "code" in error ? error.code : undefined;
  const code = typeof value === "string" ? value : "";
  if (["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"].includes(code)) return "database_unavailable";
  if (["P2021", "P2022"].includes(code)) return "database_schema";
  return "unexpected";
}

// Explicit field allowlist: no raw errors, URLs, headers, bodies, users or secrets.
export function operationalLog(level: "info" | "error", event: Event, fields: Fields = {}) {
  const label = (value: string | undefined) => value && /^[a-z_]{1,64}$/.test(value) ? value : undefined;
  const record = { timestamp: new Date().toISOString(), level, event,
    operation: label(fields.operation), category: label(fields.category),
    requestId: fields.requestId && /^[a-f0-9-]{36}$/.test(fields.requestId) ? fields.requestId : randomUUID(),
    status: fields.status, durationMs: fields.durationMs,
    database: fields.database, rateLimit: fields.rateLimit, ready: fields.ready };
  console[level === "error" ? "error" : "info"](JSON.stringify(record));
}
