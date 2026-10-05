import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
const require = createRequire(import.meta.url);
const { assertLocalSeedAllowed, seed } = require("../prisma/seed.cjs");

describe("local development seeding", () => {
  const allowed = { DATABASE_URL: "postgresql://user@127.0.0.1:5432/dev", NODE_ENV: "development", ALLOW_DEV_SEED: "1" };
  it("requires deliberate opt-in and a loopback database", () => {
    expect(() => assertLocalSeedAllowed(allowed)).not.toThrow();
    for (const change of [
      { NODE_ENV: "production" }, { ALLOW_DEV_SEED: "" },
      { DATABASE_URL: "postgresql://user@remote.example/db" },
      { DATABASE_URL: "postgresql://user@localhost/db?host=remote.example" },
    ]) expect(() => assertLocalSeedAllowed({ ...allowed, ...change })).toThrow();
  });

  it("inserts examples without clearing or overwriting existing projects", async () => {
    const upsert = vi.fn();
    await seed({ project: { upsert } });
    expect(upsert).toHaveBeenCalledTimes(2);
    for (const [args] of upsert.mock.calls) {
      expect(args.update).toEqual({});
      expect(args.where.slug).toBe(args.create.slug);
    }
  });
});
