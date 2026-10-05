import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { loadBackup, retainBackup } from "../scripts/recovery-backup.mjs";

test("retained backup authenticates data and survives reloading from disk", () => {
  const root = mkdtempSync(join(tmpdir(), "predicta-backup-test-"));
  try {
    const archive = Buffer.from("PGDMP fictional recovery content; not production data");
    const saved = retainBackup(root, archive);
    assert.deepEqual(loadBackup(root, saved.id), archive);
    const path = join(root, saved.path), original = readFileSync(path, "utf8");
    assert(!original.includes("fictional recovery content"));
    const envelope = JSON.parse(original);
    const bytes = Buffer.from(envelope.ciphertext, "base64");
    bytes[5] ^= 1; envelope.ciphertext = bytes.toString("base64");
    writeFileSync(path, JSON.stringify(envelope));
    assert.throws(() => loadBackup(root, saved.id));
    writeFileSync(path, original);
    const keyPath = join(root, saved.keyFile), key = readFileSync(keyPath);
    writeFileSync(keyPath, `RECOVERY_BACKUP_KEY=${"00".repeat(32)}\n`);
    assert.throws(() => loadBackup(root, saved.id));
    writeFileSync(keyPath, key);
    chmodSync(keyPath, 0o644);
    assert.throws(() => loadBackup(root, saved.id), /other users/);
    chmodSync(keyPath, 0o600);
    assert.deepEqual(loadBackup(root, saved.id), archive);
    assert.throws(() => loadBackup(root, "../outside"), /Invalid backup ID/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
