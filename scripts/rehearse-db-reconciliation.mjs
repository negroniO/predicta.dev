// Restores a read-only public-schema snapshot into a disposable local PostgreSQL 17.
// Never reads .env. No remote write connection or production-write mode exists.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "dotenv";
import { loadBackup, retainBackup } from "./recovery-backup.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const fixtureOnly = args.length === 1 && args[0] === "--fixture-only";
const retain = args.length === 1 && args[0] === "--retain-backup";
const backupId = args.length === 2 && args[0] === "--restore-backup" ? args[1] : undefined;
if (!(args.length === 0 || fixtureOnly || retain || backupId)) {
  console.error("Use no arguments, --fixture-only, --retain-backup, or --restore-backup BACKUP_ID");
  process.exit(1);
}
const completedProduction = join(root, "docs/production-db-reconciliation-result-2026-10-05.json");
if (!fixtureOnly && !backupId && existsSync(completedProduction) && JSON.parse(readFileSync(completedProduction)).success) {
  console.error("Production is already reconciled. Use audit-db.mjs for inspection or --restore-backup BACKUP_ID to rehearse the historical snapshot.");
  process.exit(1);
}
const image = "public.ecr.aws/supabase/postgres:17.6.1.063";
const tables = ["Account", "Category", "ContactClick", "NewsletterSubscriber", "Page", "Project", "ProjectReaction", "ProjectView", "Session", "Testimonial", "User", "VerificationToken"];
const migrations = ["20251125153248_init", "20251125190038_add_newsletter_testimonials", "20261003120000_reconcile_application_models", "20261005120000_query_indexes"];
const id = randomUUID();
const localPassword = randomUUID();
const container = `predicta-rehearsal-${id}`;
const network = `${container}-network`;
const scratch = mkdtempSync(join(tmpdir(), "predicta-rehearsal-"));
const evidence = { mode: fixtureOnly ? "synthetic fixture (not a production restore)" : backupId ? "retained backup restore (no production connection)" : "live read-only snapshot", startedAt: new Date().toISOString(), productionWrites: false, checks: {} };
const sourceFiles = ["prisma/schema.prisma", ...migrations.map(name => `prisma/migrations/${name}/migration.sql`),
  "docs/sql/production-legacy-column.sql", "docs/sql/live-schema-reconciliation-review.sql"];
let archive, localURL, containerCreated = false, networkCreated = false;

// Child output may contain data/secrets. Only validated aggregate evidence is printed.
async function run(label, bin, args, { env = process.env, input, cwd = scratch, allow = [0], timeout = 60000 } = {}) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    const chunks = []; let bytes = 0, stderr = "", settled = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    const finish = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) reject(error); else resolvePromise(value);
    };
    child.stdout.on("data", chunk => { chunks.push(chunk); bytes += chunk.length; if (bytes > 16_000_000) child.kill("SIGKILL"); });
    child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-16000); });
    child.on("error", () => finish(new Error(`${label}: client unavailable`)));
    child.on("close", code => {
      if (!allow.includes(code)) {

        const reason = /permission denied for sequence/i.test(stderr) ? "sequence SELECT permission denied"
          : /permission denied/i.test(stderr) ? "permission denied"
          : /password authentication failed/i.test(stderr) ? "authentication failed"
          : /timeout|timed out/i.test(stderr) || code === null ? "timed out"
          : /already exists/i.test(stderr) ? "object already exists"
          : /does not exist/i.test(stderr) ? "object missing" : `exit ${code}; SQLSTATE ${stderr.match(/ERROR:\s+([A-Z0-9]{5})/)?.[1] || "unavailable"}`;
        finish(new Error(`${label}: ${reason} (raw output withheld)`));
      } else finish(null, { stdout: Buffer.concat(chunks), code });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
const docker = (label, args, options) => run(label, "docker", args, options);
const digest = value => createHash("sha256").update(value).digest("hex");
const record = (name, value) => { evidence.checks[name] = value; console.log(`${name}: passed`); };
async function localSQL(sql, database = "predicta_rehearsal") {
  assert(containerCreated && ["predicta_rehearsal", "predicta_expected", "postgres"].includes(database));
  return (await docker("local SQL", ["exec", "-i", container, "psql", "-X", "-qAt", "-w", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate", "-h", "/tmp", "-U", "predicta_rehearsal", "-d", database], { input: sql })).stdout.toString().trim();
}
async function localJSON(sql, database) {
  return JSON.parse(await localSQL(`SELECT COALESCE(json_agg(t), '[]'::json) FROM (${sql}) t;`, database));
}
async function prisma(args, url = localURL, allow = [0]) {
  const target = new URL(url);
  assert.equal(target.hostname, "127.0.0.1");
  assert(["/predicta_rehearsal", "/predicta_expected"].includes(target.pathname));
  // An isolated schema directory and cwd prevent Prisma from discovering .env.
  return run(`local Prisma ${args[1]}`, process.execPath, [join(root, "node_modules/prisma/build/index.js"), ...args, ...(args[1] === "diff" ? [] : ["--schema", join(scratch, "prisma/schema.prisma")])], {
    env: { PATH: process.env.PATH, HOME: scratch, DATABASE_URL: url, CHECKPOINT_DISABLE: "1", PRISMA_HIDE_UPDATE_MESSAGE: "1" }, allow,
  });
}
async function fingerprints() {
  const result = {};
  for (const table of tables) {
    // Remove only the newly added nullable column; compare every original field.
    result[table] = (await localJSON(`SELECT count(*)::int AS rows,
      md5(coalesce(string_agg(row_json, E'\\n' ORDER BY row_json), '')) AS fingerprint
      FROM (SELECT (to_jsonb(t) - ${table === "Project" ? "'category'" : "'__no_column__'"})::text AS row_json FROM public."${table}" t) s`))[0];
  }
  return result;
}
async function sequences() {
  const names = await localJSON("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename");
  const result = {};
  for (const { sequencename: name } of names) {
    assert(/^[A-Za-z_]+$/.test(name));
    result[name] = (await localJSON(`SELECT last_value::text, is_called FROM public."${name}"`))[0];
  }
  return result;
}

try {
  evidence.sourceSha256 = Object.fromEntries(sourceFiles.map(path => [path, digest(readFileSync(join(root, path)))]));
  if (backupId) {
    archive = loadBackup(root, backupId);
    record("retainedBackupLoaded", { id: backupId, archiveSha256: digest(archive), archiveBytes: archive.length });
  } else if (!fixtureOnly) {
    const url = new URL(parse(readFileSync(join(root, ".env.audit.local"))).AUDIT_DATABASE_URL);
    assert(["postgres:", "postgresql:"].includes(url.protocol));
    assert.equal(decodeURIComponent(url.username).split(".")[0], "predicta_audit");
    assert(["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode") || "require"));
    const pg = { PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
      PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get("sslmode") || "require",
      PGCONNECT_TIMEOUT: "8", PGOPTIONS: "-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=2000 -c idle_in_transaction_session_timeout=30000" };
    const env = { PATH: process.env.PATH, HOME: scratch, ...pg };
    const preflight = JSON.parse((await run("read-only export preflight", "psql", ["-X", "-qAt", "-w", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate"], { env,
      input: `BEGIN READ ONLY;
        SELECT json_build_object('role',current_user,'read_only',current_setting('transaction_read_only'),
          'tls',(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()),
          'elevated',(SELECT rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls FROM pg_roles WHERE rolname=current_user),
          'unsafe_tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND (c.relrowsecurity OR NOT has_table_privilege(c.oid,'SELECT'))),
          'unreadable_sequences',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND CASE WHEN c.relkind='S' THEN NOT has_sequence_privilege(c.oid,'SELECT') ELSE false END),
          'user_functions',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
          'user_triggers',(SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal)); ROLLBACK;`,
    })).stdout.toString());
    assert.equal(preflight.role, "predicta_audit"); assert.equal(preflight.read_only, "on"); assert.equal(preflight.tls, true);
    assert.equal(preflight.elevated, false); assert.equal(preflight.unsafe_tables, 0);
    assert.equal(preflight.user_functions, 0); assert.equal(preflight.user_triggers, 0);
    evidence.checks.exportPreflight = preflight;
    if (preflight.unreadable_sequences) throw new Error("Export blocked: audit role lacks SELECT on eight sequences; see docs/sql/audit-sequence-read-access.sql");
    console.log("exportPreflight: passed");
    const keys = Object.keys(pg);
    assert(Object.values(pg).every(value => !/[\r\n\0]/.test(value)));
    // Credentials travel over stdin, never Docker environment/config or command arguments.
    const shell = keys.map(key => `IFS= read -r ${key}`).join("; ") + `; export ${keys.join(" ")}; exec pg_dump -w --format=custom --schema=public --strict-names --no-owner --no-acl --lock-wait-timeout=2s`;
    archive = (await docker("read-only application snapshot", ["run", "--rm", "-i", "--entrypoint", "/bin/sh", image, "-c", shell], { input: Object.values(pg).join("\n") + "\n" })).stdout;
    assert.equal(archive.subarray(0, 5).toString(), "PGDMP");
    record("snapshot", { bytes: archive.length, sha256: digest(archive), scope: "public schema, data and sequences; owner/ACL omitted", capturedAt: new Date().toISOString(), persistedToDisk: false });
    if (retain) {
      const saved = retainBackup(root, archive);
      const restored = loadBackup(root, saved.id);
      assert.equal(digest(restored), digest(archive), "Retained backup differs from the exported snapshot");
      archive.fill(0); archive = restored; // Rehearse the archive read back from disk.
      record("retainedBackup", { ...saved, decryptedChecksumMatches: true });
    }
  }
  await docker("isolated network", ["network", "create", "--opt", "com.docker.network.bridge.enable_ip_masquerade=false", network]); networkCreated = true;
  await docker("local PostgreSQL start", ["run", "-d", "--name", container, "--network", network, "--user", "postgres",
    "--tmpfs", "/rehearsal:rw,noexec,nosuid,mode=0700,uid=101,gid=102", "--publish", "127.0.0.1::5432", "--entrypoint", "/bin/sh", image, "-c",
    "/usr/lib/postgresql/bin/initdb -D /rehearsal/data -U predicta_rehearsal -A trust --no-locale >/dev/null && printf '\\nhost all all 0.0.0.0/0 scram-sha-256\\n' >> /rehearsal/data/pg_hba.conf && exec /usr/lib/postgresql/bin/postgres -D /rehearsal/data -h 0.0.0.0 -k /tmp -c max_connections=20 -c log_statement=none"]);
  containerCreated = true;
  for (let attempt = 0; ; attempt++) {
    const ready = await docker("local readiness", ["exec", container, "pg_isready", "-h", "/tmp", "-U", "predicta_rehearsal", "-d", "postgres"], { allow: [0, 1, 2] });
    if (ready.code === 0) break;
    assert(attempt < 30, "Local PostgreSQL did not start");
    await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
  }
  const port = (await docker("local port", ["port", container, "5432/tcp"])).stdout.toString().trim();
  assert(/^127\.0\.0\.1:\d+$/.test(port));
  localURL = `postgresql://predicta_rehearsal:${localPassword}@${port}/predicta_rehearsal`;
  await localSQL(`ALTER ROLE predicta_rehearsal PASSWORD '${localPassword}'; CREATE DATABASE predicta_rehearsal; CREATE DATABASE predicta_expected;`, "postgres");
  cpSync(join(root, "prisma"), join(scratch, "prisma"), { recursive: true });
  if (!archive) {
    assert(fixtureOnly);
    await prisma(["migrate", "deploy"]);
    await localSQL(`
      INSERT INTO "Project" (slug,title,description,year,status,tags,"techStack","updatedAt")
        VALUES ('Mixed-Slug','Fixture','Fixture content',2026,'Completed',ARRAY['fixture'],ARRAY['TypeScript'],now()),
        ('fixture-draft','Draft','Private fixture',2026,'Draft',ARRAY[]::text[],ARRAY[]::text[],now());
      INSERT INTO "Page" (slug,title,content,"updatedAt") VALUES ('fixture-page','Fixture','Content',now());
      INSERT INTO "ProjectView" ("projectId",path) SELECT id,'/fixture' FROM "Project";
      INSERT INTO "ProjectReaction" ("projectId",kind,"visitorId","updatedAt") SELECT id,'like','fixture-visitor',now() FROM "Project" WHERE slug='Mixed-Slug';
      INSERT INTO "User" (id,name,email) VALUES ('fixture-user','Fixture','fixture@example.invalid');
      INSERT INTO "Account" (id,"userId",type,provider,"providerAccountId") VALUES ('fixture-account','fixture-user','oauth','github','fixture-only');
      INSERT INTO "Session" (id,"userId","sessionToken",expires) VALUES ('fixture-session','fixture-user','nonfunctional-fixture-token',now()-interval '1 day');
      INSERT INTO "ContactClick" (href) VALUES ('https://example.invalid/fixture');
      INSERT INTO "NewsletterSubscriber" (email) VALUES ('fixture@example.invalid');
      ALTER TABLE "Project" DROP COLUMN category;
      DROP INDEX "Project_categoryId_idx"; DROP INDEX "ContactClick_createdAt_idx"; DROP INDEX "ProjectReaction_updatedAt_idx";
      DELETE FROM "_prisma_migrations" WHERE migration_name IN ('${migrations[2]}','${migrations[3]}');
    `);
    await localSQL('CREATE ROLE predicta_audit;');
    await localSQL(readFileSync(join(root, "docs/sql/audit-sequence-read-access.sql"), "utf8"));
    const grants = await localJSON(`SELECT has_sequence_privilege('predicta_audit', c.oid, 'SELECT') AS can_read,
      has_sequence_privilege('predicta_audit', c.oid, 'USAGE,UPDATE') AS can_advance_or_set
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S'`);
    assert.equal(grants.length, 8);
    assert(grants.every(row => row.can_read && !row.can_advance_or_set));
    record("sequenceGrantFixture", { readableSequences: 8, grantsAdvanceOrSet: false });
    const fixtureBefore = await fingerprints(), fixtureSequences = await sequences();
    archive = (await docker("fixture snapshot", ["exec", container, "pg_dump", "-h", "/tmp", "-U", "predicta_rehearsal", "-d", "predicta_rehearsal", "--format=custom", "--schema=public", "--no-owner", "--no-acl"])).stdout;
    await localSQL('DROP DATABASE predicta_rehearsal; CREATE DATABASE predicta_rehearsal;', "postgres");
    await localSQL("DROP SCHEMA public;"); // Empty, freshly created local database only.
    await docker("fixture snapshot restore", ["exec", "-i", container, "pg_restore", "--exit-on-error", "--single-transaction", "--no-owner", "--no-acl", "-h", "/tmp", "-U", "predicta_rehearsal", "-d", "predicta_rehearsal"], { input: archive });
    assert.deepEqual(await fingerprints(), fixtureBefore); assert.deepEqual(await sequences(), fixtureSequences);
    record("fixtureSnapshotRestore", { originalFieldsAndSequencesEqual: true });
  } else {
    await localSQL("DROP SCHEMA public;"); // pg_dump includes CREATE SCHEMA public.
    await docker("snapshot restore", ["exec", "-i", container, "pg_restore", "--exit-on-error", "--single-transaction", "--no-owner", "--no-acl", "-h", "/tmp", "-U", "predicta_rehearsal", "-d", "predicta_rehearsal"], { input: archive });
  }
  archive.fill(0); archive = undefined;
  record("restored", { version: await localSQL("SHOW server_version;"), network: "dedicated bridge, masquerading disabled, loopback port only", storage: "disposable tmpfs" });
  const before = await fingerprints(), seqBefore = await sequences();
  const historyBefore = await localJSON('SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY migration_name');
  assert.deepEqual(historyBefore.map(row => row.migration_name), migrations.slice(0, 2));
  for (const row of historyBefore) {
    assert.equal(row.checksum, digest(readFileSync(join(root, "prisma/migrations", row.migration_name, "migration.sql"))));
    assert(row.finished && !row.rolled_back);
  }
  record("restoredHistory", { matchingMigrations: historyBefore.length });
  const diff = await prisma(["migrate", "diff", "--from-url", localURL, "--to-schema-datamodel", join(scratch, "prisma/schema.prisma"), "--script"]);
  const normalize = sql => sql.replace(/^--.*$/gm, "").replace(/\s+/g, " ").trim();
  const review = readFileSync(join(root, "docs/sql/live-schema-reconciliation-review.sql"), "utf8");
  const physical = review.slice(review.indexOf("-- AlterTable"), review.indexOf("ROLLBACK;"));
  assert.equal(normalize(diff.stdout.toString()), normalize(physical), "Live snapshot drift changed; stop for review");
  record("expectedFourDifferences", true);
  await localSQL(review);
  const rollbackDiff = await prisma(["migrate", "diff", "--from-url", localURL, "--to-schema-datamodel", join(scratch, "prisma/schema.prisma"), "--script"]);
  assert.equal(normalize(rollbackDiff.stdout.toString()), normalize(physical));
  assert.deepEqual(await fingerprints(), before); assert.deepEqual(await sequences(), seqBefore);
  record("reviewSQLRollback", true);

  // The baseline must match the FULL third migration before resolving its history.
  rmSync(join(scratch, "prisma/migrations", migrations[3]), { recursive: true });
  const expectedTarget = new URL(localURL);
  expectedTarget.pathname = "/predicta_expected";
  const expectedURL = expectedTarget.toString();
  await prisma(["migrate", "deploy"], expectedURL);
  await localSQL(readFileSync(join(root, "docs/sql/production-legacy-column.sql"), "utf8"));
  await prisma(["migrate", "diff", "--from-url", localURL, "--to-url", expectedURL, "--exit-code"]);
  const backfill = (await localJSON(`SELECT count(*)::int AS outstanding FROM "Project" WHERE NULLIF(TRIM(category),'') IS NOT NULL AND "categoryId" IS NULL`))[0];
  assert.equal(backfill.outstanding, 0);
  record("fullThirdMigrationEquivalent", { physicalSchema: true, outstandingCategoryBackfill: 0 });
  await prisma(["migrate", "resolve", "--applied", migrations[2]]);
  cpSync(join(root, "prisma/migrations", migrations[3]), join(scratch, "prisma/migrations", migrations[3]), { recursive: true });
  await prisma(["migrate", "deploy"]);
  await prisma(["migrate", "status"]);
  await prisma(["migrate", "diff", "--from-url", localURL, "--to-schema-datamodel", join(scratch, "prisma/schema.prisma"), "--exit-code"]);
  record("finalSchemaAndStatus", true);
  const historyAfter = await localJSON('SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY migration_name');
  assert.deepEqual(historyAfter.map(row => row.migration_name), migrations);
  for (const row of historyAfter) {
    assert.equal(row.checksum, digest(readFileSync(join(root, "prisma/migrations", row.migration_name, "migration.sql"))));
    assert(row.finished && !row.rolled_back);
  }
  assert.deepEqual(historyAfter.slice(0, 2), historyBefore);
  await prisma(["migrate", "deploy"]);
  assert.deepEqual(await localJSON('SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY migration_name'), historyAfter);
  assert.deepEqual(await fingerprints(), before); assert.deepEqual(await sequences(), seqBefore);
  assert.equal(await localSQL('SELECT count(*) FROM "Project" WHERE category IS NOT NULL;'), "0");
  record("dataPreservation", { tables: tables.length, allOriginalFieldsEqual: true, allSequenceValuesEqual: true, oldMigrationChecksumsEqual: true, secondDeployNoOp: true,
    rowCounts: Object.fromEntries(Object.entries(before).map(([table, value]) => [table, value.rows])) });

  // Use the actual generated client, without invoking external auth/storage providers.
  const smokePath = join(scratch, "client-smoke.cjs");
  writeFileSync(smokePath, `const assert = require('node:assert/strict');
const { PrismaClient } = require(${JSON.stringify(join(root, "node_modules/@prisma/client"))});
const db = new PrismaClient({datasourceUrl: process.env.DATABASE_URL});
(async () => { try {
  const projects = await db.project.findMany({include:{category:true, reactions:true, _count:{select:{views:true}}}});
  assert.equal(projects.length, ${before.Project.rows});
  assert(projects.every(p => p.legacyCategory === null));
  await Promise.all([db.page.findMany(), db.user.findMany({include:{accounts:true,sessions:true}}), db.contactClick.count(), db.projectReaction.count()]);
  const rollback = new Error('intentional local rollback');
  try { await db.$transaction(async tx => {
    const c = await tx.category.create({data:{name:'Rehearsal only',slug:'rehearsal-${id}'}});
    const p = await tx.project.create({data:{slug:'rehearsal-${id}',title:'Rehearsal only',description:'Local transaction',year:2026,status:'Draft',tags:[],techStack:[],categoryId:c.id}});
    await tx.projectReaction.create({data:{projectId:p.id,kind:'like',visitorId:'local-rehearsal'}});
    await tx.projectView.create({data:{projectId:p.id,path:'/local-rehearsal'}});
    await tx.project.update({where:{id:p.id},data:{title:'Local updated'}});
    await tx.project.delete({where:{id:p.id}});
    assert.equal(await tx.projectReaction.count({where:{projectId:p.id}}),0);
    assert.equal(await tx.projectView.count({where:{projectId:p.id}}),0);
    throw rollback;
  }); } catch(e) { if(e !== rollback) throw e; }
  console.log('client smoke passed');
} finally { await db.$disconnect(); } })().catch(() => {console.error('client smoke failed (details withheld)');process.exitCode=1;});
`);
  await run("local generated-client smoke", process.execPath, [smokePath], { env: { PATH: process.env.PATH, HOME: scratch, DATABASE_URL: localURL } });
  assert.deepEqual(await fingerprints(), before);
  record("generatedClientSmoke", { scalarAndRelationReads: true, localDraftCreateUpdateDelete: true, reactionAndViewCascade: true, originalRowsPreserved: true,
    note: "Rolled-back INSERTs consume local sequence values; preservation above was checked before this disposable smoke test." });
  assert.deepEqual(Object.fromEntries(sourceFiles.map(path => [path, digest(readFileSync(join(root, path)))])), evidence.sourceSha256);
  evidence.success = true;
} catch (error) {
  evidence.success = false;
  // Assertion diffs could contain data: save only a fixed classification.
  evidence.failure = error.code === "ERR_ASSERTION" ? "Safety or equivalence assertion failed; inspect the named stage" : error.message;
  console.error(evidence.failure);
  process.exitCode = 1;
} finally {
  archive?.fill(0);
  if (containerCreated) {
    try { await docker("local container cleanup", ["rm", "-f", "-v", container]); evidence.containerRemoved = true; }
    catch { evidence.containerRemoved = false; process.exitCode = 1; }
  }
  if (networkCreated) {
    try { await docker("local network cleanup", ["network", "rm", network]); evidence.networkRemoved = true; }
    catch { evidence.networkRemoved = false; process.exitCode = 1; }
  }
  rmSync(scratch, { recursive: true, force: true });
  evidence.finishedAt = new Date().toISOString();
  const evidenceName = fixtureOnly ? "fixture" : retain ? "retained" : backupId ? "restore" : "rehearsal";
  writeFileSync(resolve(root, `docs/db-reconciliation-${evidenceName}-2026-10-05.json`), JSON.stringify(evidence, null, 2) + "\n", { mode: 0o600 });
  console.log("Sanitized rehearsal evidence saved; production was read-only.");
}
