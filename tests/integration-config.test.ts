import { describe, expect, it } from "vitest";
import { integrationConfig } from "./integration-config.mjs";

describe("integration service isolation", () => {
  it("defaults to disposable loopback services", () => {
    const config = integrationConfig({});
    expect(new URL(config.database).pathname).toBe("/predicta_test");
    expect(config.base).toBe("http://127.0.0.1:3107");
  });

  it.each([
    { DATABASE_URL: "postgresql://example.com/predicta_test" },
    { DATABASE_URL: "postgresql://localhost/production" },
    { DATABASE_URL: "postgresql://localhost/predicta_test?host=example.com" },
    { REDIS_URL: "redis://example.com:6379" },
    { REDIS_URL: "redis://localhost:6379/1" },
    { PHASE0_TEST_BASE_URL: "https://example.com:3107" },
    { PHASE0_TEST_BASE_URL: "http://localhost:3107/some-app" },
  ])("refuses unsafe service configuration %j", (env) => {
    expect(() => integrationConfig(env)).toThrow();
  });
});
