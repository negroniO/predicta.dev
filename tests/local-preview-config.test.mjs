import { afterEach, expect, test, vi } from "vitest";
import { localDatabase, localEnvironment, localOrigin } from "../scripts/local-preview-config.mjs";

afterEach(() => vi.unstubAllEnvs());
test("local preview overrides inherited service endpoints and external credentials", () => {
  for (const name of ["DATABASE_URL", "REDIS_URL", "NEXTAUTH_URL", "NEXTAUTH_URL_INTERNAL", "NEXTAUTH_SECRET", "GITHUB_ID", "GITHUB_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL"]) vi.stubEnv(name,"remote-fixture-value");
  const env = localEnvironment();
  expect(env.DATABASE_URL).toBe(localDatabase);
  expect(new URL(env.DATABASE_URL).hostname).toBe("127.0.0.1");
  expect(new URL(env.DATABASE_URL).pathname).toBe("/predicta_local");
  expect(new URL(env.REDIS_URL).hostname).toBe("127.0.0.1");
  expect(env.NEXTAUTH_URL).toBe(localOrigin);
  expect(env.NEXTAUTH_URL_INTERNAL).toBe(localOrigin);
  expect(env.NEXT_PUBLIC_SITE_URL).toBe(localOrigin);
  expect(env.NEXT_PUBLIC_BASE_URL).toBe(localOrigin);
  expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("");
  expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("");
  expect(env.GITHUB_ID).toBe("local-preview-not-configured");
  expect(env.GITHUB_SECRET).toBe("local-preview-not-configured");
  expect(env.NEXTAUTH_SECRET).toMatch(/^[a-f0-9]{64}$/);
});
