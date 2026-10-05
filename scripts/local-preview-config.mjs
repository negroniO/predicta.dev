import { randomBytes } from "node:crypto";

// Explicit constants prevent the preview from inheriting production endpoints.
export const localDatabase = "postgresql://predicta_local:local_preview_only@127.0.0.1:55441/predicta_local";
export const localOrigin = "http://127.0.0.1:3001";
export function localEnvironment() {
  return { ...process.env, NODE_ENV: "development", PREDICTA_LOCAL_PREVIEW: "1",
    DATABASE_URL: localDatabase, REDIS_URL: "redis://127.0.0.1:56381",
    NEXTAUTH_URL: localOrigin, NEXTAUTH_URL_INTERNAL: localOrigin, NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
    GITHUB_ID: "local-preview-not-configured", GITHUB_SECRET: "local-preview-not-configured", ADMIN_GITHUB_IDS: "203515807",
    NEXT_PUBLIC_SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "",
    NEXT_PUBLIC_SITE_URL: localOrigin, NEXT_PUBLIC_BASE_URL: localOrigin,
    RATE_LIMIT_BACKEND: "redis", RATE_LIMIT_IP_HEADER: "", NEXT_TELEMETRY_DISABLED: "1", ALLOW_DEV_SEED: "1",
  };
}
