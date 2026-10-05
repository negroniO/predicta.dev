import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const keyName = ".env.recovery-key.local";
const directory = ".local-backups";
const hash = data => createHash("sha256").update(data).digest("hex");
const aad = Buffer.from("predicta-public-pgdump-aes256gcm-v1");
const validId = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

function privatePath(path, isDirectory = false) {
  const stat = lstatSync(path);
  assert(!stat.isSymbolicLink() && (isDirectory ? stat.isDirectory() : stat.isFile()), "Recovery path must be a regular file/directory");
  assert.equal(stat.mode & 0o077, 0, "Recovery files must not be accessible to other users");
}
function keyFor(root, create = false) {
  const path = join(root, keyName);
  if (!existsSync(path) && create) {
    const key = randomBytes(32);
    try { writeFileSync(path, `RECOVERY_BACKUP_KEY=${key.toString("hex")}\n`, { mode: 0o600, flag: "wx", flush: true }); }
    finally { key.fill(0); }
  }
  privatePath(path);
  const match = /^RECOVERY_BACKUP_KEY=([0-9a-f]{64})\n?$/.exec(readFileSync(path, "utf8"));
  assert(match, "Recovery key format is invalid (value withheld)");
  return Buffer.from(match[1], "hex");
}

export function retainBackup(root, archive) {
  assert.equal(archive.subarray(0, 5).toString(), "PGDMP", "Expected a PostgreSQL custom archive");
  const folder = join(root, directory);
  if (!existsSync(folder)) mkdirSync(folder, { mode: 0o700 });
  privatePath(folder, true);
  const id = randomUUID(), key = keyFor(root, true), iv = randomBytes(12);
  try {
    const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    cipher.setAAD(aad);
    const encrypted = Buffer.concat([cipher.update(archive), cipher.final()]);
    const envelope = { version: 1, algorithm: "aes-256-gcm", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: encrypted.toString("base64") };
    writeFileSync(join(folder, `${id}.json`), JSON.stringify(envelope), { mode: 0o600, flag: "wx", flush: true });
    return { id, path: `${directory}/${id}.json`, archiveSha256: hash(archive), archiveBytes: archive.length, encrypted: true, keyFile: keyName };
  } finally { key.fill(0); }
}

export function loadBackup(root, id) {
  assert(validId(id), "Invalid backup ID");
  privatePath(join(root, directory), true);
  const path = join(root, directory, `${id}.json`);
  privatePath(path);
  assert(lstatSync(path).size <= 24_000_000, "Backup exceeds this runner's size limit");
  const envelope = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(envelope.version, 1); assert.equal(envelope.algorithm, "aes-256-gcm");
  const iv = Buffer.from(envelope.iv, "base64"), tag = Buffer.from(envelope.tag, "base64");
  assert.equal(iv.length, 12); assert.equal(tag.length, 16);
  const key = keyFor(root);
  let pending;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    decipher.setAAD(aad); decipher.setAuthTag(tag);
    pending = decipher.update(Buffer.from(envelope.ciphertext, "base64"));
    const archive = Buffer.concat([pending, decipher.final()]);
    assert.equal(archive.subarray(0, 5).toString(), "PGDMP");
    return archive;
  } finally { key.fill(0); pending?.fill(0); }
}
