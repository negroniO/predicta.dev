// One-time operation explicitly approved by the owner on 2026-10-05.
// Requires the exact reviewed files, a fresh restore-tested backup and explicit CLI mode.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { loadBackup } from "./recovery-backup.mjs";

if (process.argv.length !== 3 || process.argv[2] !== "--apply-approved-production") {
  console.error("This one-time production operation requires --apply-approved-production and owner authorization.");
  process.exit(1);
}
const root = process.cwd();
const reportPath = join(root, "docs/production-db-reconciliation-result-2026-10-05.json");
if (existsSync(reportPath) && JSON.parse(readFileSync(reportPath)).success) {
  console.error("Production reconciliation already succeeded. Refusing a repeat run or overwriting its evidence.");
  process.exit(1);
}
const scratch = mkdtempSync(join(tmpdir(), "predicta-production-reconciliation-"));
const result = { startedAt: new Date().toISOString(), authorization: "Owner explicitly approved the reviewed three-step production reconciliation in chat", stages: {}, productionMutationStarted: false };
const migrations = ["20251125153248_init", "20251125190038_add_newsletter_testimonials", "20261003120000_reconcile_application_models", "20261005120000_query_indexes"];
const tables = ["Account", "Category", "ContactClick", "NewsletterSubscriber", "Page", "Project", "ProjectReaction", "ProjectView", "Session", "Testimonial", "User", "VerificationToken"];
const sequenceTables = ["Category", "ContactClick", "NewsletterSubscriber", "Page", "Project", "ProjectReaction", "ProjectView", "Testimonial"];
const container = `predicta-approved-${randomUUID()}`, network = `${container}-network`, localPassword = randomUUID();
let containerCreated = false, networkCreated = false, stage = "source verification";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const normalize = sql => sql.replace(/^--.*$/gm, "").replace(/\s+/g, " ").trim();
const save = () => writeFileSync(reportPath, JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
const record = (name, details = true) => { result.stages[name] = details; save(); console.log(`${name}: passed`); };

async function run(label, bin, args, { env = process.env, input, timeout = 60000 } = {}) {
  stage = label;
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: scratch, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", finished = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    const finish = (error, value) => { if (finished) return; finished = true; clearTimeout(timer); if (error) reject(error); else resolve(value); };
    child.stdout.on("data", data => { stdout += data; if (stdout.length > 2_000_000) child.kill("SIGKILL"); });
    child.stderr.on("data", data => { stderr = (stderr + data).slice(-16000); });
    child.stdin.on("error", () => {});
    child.on("error", () => finish(new Error("client_unavailable")));
    child.on("close", code => {
      if (code === 0) return finish(null, stdout.trim());
      const known = /password authentication failed/i.test(stderr) ? "authentication_failed"
        : /permission denied/i.test(stderr) ? "permission_denied"
        : /timeout|timed out/i.test(stderr) || code === null ? "timeout"
        : [...stderr.matchAll(/\b(?:P\d{4}|[0-9]{2}[A-Z0-9]{3})\b/g)].map(m => m[0])[0] || "operation_failed";
      finish(new Error(known)); // Raw tool output may contain credentials: never log it.
    });
    child.stdin.end(input);
  });
}
const docker = (label, args, options) => run(label, "docker", args, options);
function connection(raw, readOnly) {
  const url = new URL(raw);
  assert(["postgres:", "postgresql:"].includes(url.protocol));
  assert.equal(url.searchParams.get("sslmode") || "require", "require");
  assert(!url.searchParams.has("host"), "Socket routing overrides are not allowed");
  const options = `-c default_transaction_read_only=${readOnly ? "on" : "off"} -c lock_timeout=2000 -c statement_timeout=30000 -c idle_in_transaction_session_timeout=30000`;
  url.search = "";
  for (const [key, value] of Object.entries({ sslmode: "require", schema: "public", connection_limit: "1", connect_timeout: "8", pool_timeout: "8", socket_timeout: "35", options, application_name: "predicta_approved_reconciliation" })) url.searchParams.set(key, value);
  const env = { PATH: process.env.PATH, HOME: scratch, PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: "require", PGCONNECT_TIMEOUT: "8", PGOPTIONS: options, PGAPPNAME: "predicta_approved_reconciliation" };
  return { url, env };
}
async function sql(conn, command, readOnly = true) {
  return run(readOnly ? "production read-only verification" : "approved production DDL", "psql", ["-X", "-qAt", "-w", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate"], { env: conn.env, input: readOnly ? `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL lock_timeout='2s'; SET LOCAL statement_timeout='30s';\n${command}\nROLLBACK;` : command });
}
const query = async (conn, statement) => JSON.parse(await sql(conn, `SELECT COALESCE(json_agg(t),'[]'::json) FROM (${statement}) t;`));
async function history(conn) {
  return query(conn, 'SELECT migration_name,checksum,finished_at IS NOT NULL AS finished,rolled_back_at IS NOT NULL AS rolled_back FROM public."_prisma_migrations" ORDER BY migration_name');
}
function verifyHistory(rows, count, approved) {
  assert.deepEqual(rows.map(row => row.migration_name), migrations.slice(0, count));
  for (const row of rows) { assert(row.finished && !row.rolled_back); assert.equal(row.checksum, approved.sourceSha256[`prisma/migrations/${row.migration_name}/migration.sql`]); }
}
async function dataState(conn) {
  return query(conn, tables.map(table => `SELECT '${table}' AS table_name,count(*)::int AS rows, md5(coalesce(string_agg((to_jsonb(t) - '${table === "Project" ? "category" : "__absent__"}')::text,E'\\n' ORDER BY (to_jsonb(t) - '${table === "Project" ? "category" : "__absent__"}')::text),'')) AS fingerprint FROM public."${table}" t`).join(" UNION ALL "));
}
const grantsSQL = `SELECT c.relname,r.rolname, c.relrowsecurity, c.relforcerowsecurity,c.relowner::text,
  has_table_privilege(r.oid,c.oid,'SELECT') AS sel,has_table_privilege(r.oid,c.oid,'INSERT') AS ins,
  has_table_privilege(r.oid,c.oid,'UPDATE') AS upd,has_table_privilege(r.oid,c.oid,'DELETE') AS del
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN pg_roles r
  WHERE n.nspname='public' AND c.relkind='r' AND r.rolname IN ('anon','authenticated','service_role','predicta_audit') ORDER BY c.relname,r.rolname`;
const orphanSQL = [['ProjectView','Project','projectId'],['ProjectReaction','Project','projectId'],['Project','Category','categoryId'],['Account','User','userId'],['Session','User','userId']]
  .map(([child,parent,fk]) => `SELECT '${child}_${parent}' AS relation,count(*)::int AS orphans FROM public."${child}" c LEFT JOIN public."${parent}" p ON p.id=c."${fk}" WHERE c."${fk}" IS NOT NULL AND p.id IS NULL`).join(" UNION ALL ");
const sequenceSQL = sequenceTables.map(table => `SELECT '${table}' AS name,last_value::text,is_called FROM public."${table}_id_seq"`).join(" UNION ALL ");

try {
  const approved = JSON.parse(readFileSync(join(root, "docs/db-reconciliation-restore-2026-10-05.json")));
  assert(approved.success && approved.containerRemoved && approved.networkRemoved);
  const verifySource = () => { for (const [path, digest] of Object.entries(approved.sourceSha256)) assert.equal(hash(readFileSync(join(root, path))), digest, "Reviewed source changed"); };
  verifySource(); result.sourceSha256 = approved.sourceSha256;
  const backup = JSON.parse(readFileSync(join(root, "docs/db-reconciliation-retained-2026-10-05.json")));
  assert(backup.success && backup.containerRemoved && backup.networkRemoved);
  assert(Date.now() - Date.parse(backup.checks.snapshot.capturedAt) < 30 * 60 * 1000, "Backup is stale");
  assert.deepEqual(backup.sourceSha256, approved.sourceSha256);
  const archive = loadBackup(root, backup.checks.retainedBackup.id);
  try { assert.equal(hash(archive), backup.checks.retainedBackup.archiveSha256); } finally { archive.fill(0); }
  record("reviewedSourceAndRecovery", { backupId: backup.checks.retainedBackup.id, archiveSha256: backup.checks.retainedBackup.archiveSha256, capturedAt: backup.checks.snapshot.capturedAt });

  stage = "connection configuration";
  const audit = connection(parse(readFileSync(join(root, ".env.audit.local"))).AUDIT_DATABASE_URL, true);
  const admin = connection(parse(readFileSync(join(root, ".env"))).DATABASE_URL, false);
  const adminRead = connection(admin.url.toString(), true);
  const project = url => decodeURIComponent(url.username).split(".").slice(1).join(".");
  assert.equal(decodeURIComponent(audit.url.username).split(".")[0], "predicta_audit");
  assert.equal(decodeURIComponent(admin.url.username).split(".")[0], "postgres");
  assert(project(audit.url) && project(audit.url) === project(admin.url));
  for (const field of ["hostname", "port", "pathname"]) assert.equal(audit.url[field], admin.url[field]);
  const identitySQL = `SELECT current_user AS role,current_database() AS database,current_setting('transaction_read_only') AS read_only,current_setting('lock_timeout') AS lock_timeout,current_setting('statement_timeout') AS statement_timeout,(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS tls`;
  const [a] = await query(audit, identitySQL), [b] = await query(adminRead, identitySQL);
  result.connectionChecks = { auditRole: a.role, ownerRole: b.role, sameDatabase: a.database === b.database,
    auditReadOnly: a.read_only, ownerReadOnly: b.read_only, auditTLS: a.tls, ownerTLS: b.tls }; save();
  assert.equal(a.role, "predicta_audit"); assert.equal(b.role, "postgres"); assert.equal(a.database, b.database);
  assert(a.tls && b.tls && a.read_only === "on" && b.read_only === "on");
  const probe = new PrismaClient({ datasourceUrl: adminRead.url.toString() });
  try {
    stage = "Prisma connection settings";
    const [startup] = await probe.$queryRawUnsafe(identitySQL);
    result.startupOptionsHonored = startup.read_only === "on" && startup.lock_timeout === "2s" && startup.statement_timeout === "30s";
    const settings = await probe.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout='2s'");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout='30s'");
      return (await tx.$queryRawUnsafe(identitySQL))[0];
    }, { timeout: 35000 });
    result.prismaConnectionChecks = { role: settings.role, readOnly: settings.read_only, tls: settings.tls,
      lockTimeout: settings.lock_timeout, statementTimeout: settings.statement_timeout }; save();
    assert.equal(settings.role, "postgres"); assert.equal(settings.read_only, "on"); assert(settings.tls);
    assert.equal(settings.lock_timeout, "2s"); assert.equal(settings.statement_timeout, "30s");
  } finally { await probe.$disconnect(); }
  record("targetAndTLS", { sameAuditedTarget: true, ownerLoginConfirmedReadOnly: true, explicitTransactionTimeoutsVerified: true });
  const oldHistory = await history(audit); verifyHistory(oldHistory, 2, approved);
  const before = await dataState(audit), grantsBefore = await query(audit, grantsSQL), seqBefore = await query(audit, sequenceSQL);
  assert((await query(audit, orphanSQL)).every(row => row.orphans === 0));
  record("before", { rowCounts: Object.fromEntries(before.map(row => [row.table_name,row.rows])), recordedMigrations: 2, orphanRelationships: 0 });

  await docker("reference network", ["network","create","--opt","com.docker.network.bridge.enable_ip_masquerade=false",network]); networkCreated = true;
  await docker("reference PostgreSQL", ["run","-d","--name",container,"--network",network,"--user","postgres","--tmpfs","/reference:rw,noexec,nosuid,mode=0700,uid=101,gid=102","--publish","127.0.0.1::5432","--entrypoint","/bin/sh","public.ecr.aws/supabase/postgres:17.6.1.063","-c",
    "/usr/lib/postgresql/bin/initdb -D /reference/data -U predicta_reference -A trust --no-locale >/dev/null && printf '\\nhost all all 0.0.0.0/0 scram-sha-256\\n' >> /reference/data/pg_hba.conf && exec /usr/lib/postgresql/bin/postgres -D /reference/data -h 0.0.0.0 -k /tmp"]);
  containerCreated = true;
  const localSQL = (input,database="postgres") => docker("reference SQL", ["exec","-i",container,"psql","-X","-qAt","-w","-v","ON_ERROR_STOP=1","-h","/tmp","-U","predicta_reference","-d",database], { input });
  // The already-tested image initializes in under a second; poll via SQL without printing errors.
  for (let attempt = 0; ; attempt++) {
    try { await localSQL("SELECT 1;"); break; }
    catch { assert(attempt < 20, "Reference database unavailable"); await new Promise(resolve => setTimeout(resolve,500)); }
  }
  await localSQL(`ALTER ROLE predicta_reference PASSWORD '${localPassword}'; CREATE DATABASE predicta_reference;`);
  const port = await docker("reference port",["port",container,"5432/tcp"]); assert(/^127\.0\.0\.1:\d+$/.test(port));
  const referenceURL = `postgresql://predicta_reference:${localPassword}@${port}/predicta_reference`;
  cpSync(join(root,"prisma"),join(scratch,"production"),{recursive:true});
  cpSync(join(root,"prisma"),join(scratch,"reference"),{recursive:true});
  rmSync(join(scratch,"reference/migrations",migrations[3]),{recursive:true});
  const schema = readFileSync(join(root,"prisma/schema.prisma"),"utf8");
  writeFileSync(join(scratch,"audit.prisma"),schema.replace('env("DATABASE_URL")','env("AUDIT_DATABASE_URL")'));
  writeFileSync(join(scratch,"reference.prisma"),schema.replace('env("DATABASE_URL")','env("REFERENCE_DATABASE_URL")'));
  const cli = (label,args,target=audit.url.toString()) => run(label,process.execPath,[join(root,"node_modules/prisma/build/index.js"),...args], { env: { PATH:process.env.PATH,HOME:scratch,DATABASE_URL:target,AUDIT_DATABASE_URL:audit.url.toString(),REFERENCE_DATABASE_URL:referenceURL,CHECKPOINT_DISABLE:"1",PRISMA_HIDE_UPDATE_MESSAGE:"1" } });
  await cli("build reference schema",["migrate","deploy","--schema",join(scratch,"reference/schema.prisma")],referenceURL);
  const indexSQL = readFileSync(join(root,"prisma/migrations",migrations[3],"migration.sql"),"utf8");
  const boundedIndexes = `BEGIN; SET LOCAL lock_timeout='2s'; SET LOCAL statement_timeout='30s'; SET LOCAL search_path=public,pg_catalog;\n${indexSQL}\nCOMMIT;`;
  await localSQL(boundedIndexes.replace(/COMMIT;$/, "ROLLBACK;"), "predicta_reference");
  assert.equal(await localSQL(`SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('Project_categoryId_idx','ContactClick_createdAt_idx','ProjectReaction_updatedAt_idx');`, "predicta_reference"), "0");
  record("boundedIndexTransactionRehearsed",true);
  const fullDiffArgs = ["migrate","diff","--from-schema-datasource",join(scratch,"audit.prisma"),"--to-schema-datamodel",join(scratch,"production/schema.prisma")];
  const diff = await cli("recheck exact live drift",[...fullDiffArgs,"--script"]);
  const review = readFileSync(join(root,"docs/sql/live-schema-reconciliation-review.sql"),"utf8");
  assert.equal(normalize(diff),normalize(review.slice(review.indexOf("-- AlterTable"),review.indexOf("ROLLBACK;"))));
  verifySource(); verifyHistory(await history(audit),2,approved);
  record("exactApprovedDrift",true);

  result.productionMutationStarted = true; save();
  await sql(admin,readFileSync(join(root,"docs/sql/production-legacy-column.sql"),"utf8"),false);
  record("nullableColumnCommitted",true);
  await cli("verify full third migration state",["migrate","diff","--from-schema-datasource",join(scratch,"audit.prisma"),"--to-schema-datasource",join(scratch,"reference.prisma"),"--exit-code"]);
  assert.equal((await query(audit,`SELECT count(*)::int AS pending FROM public."Project" WHERE NULLIF(TRIM(category),'') IS NOT NULL AND "categoryId" IS NULL`))[0].pending,0);
  record("thirdMigrationStateEquivalent",true);
  verifySource();
  await cli("resolve approved migration history",["migrate","resolve","--applied",migrations[2],"--schema",join(scratch,"production/schema.prisma")],admin.url.toString());
  verifyHistory(await history(audit),3,approved); record("thirdMigrationResolved",true);
  // Supavisor ignored startup options. Apply the exact approved SQL with explicit
  // transaction-local timeouts, verify equivalence, then reconcile its history.
  await sql(admin,boundedIndexes,false);
  record("indexTransactionCommitted",true);
  await cli("verify index migration state",[...fullDiffArgs,"--exit-code"]);
  await cli("resolve verified index migration",["migrate","resolve","--applied",migrations[3],"--schema",join(scratch,"production/schema.prisma")],admin.url.toString());
  verifyHistory(await history(audit),4,approved);
  await cli("verify normal deployment has no pending migration",["migrate","deploy","--schema",join(scratch,"production/schema.prisma")],admin.url.toString());
  record("indexMigrationResolvedAndDeployVerified",true);
  await cli("verify final schema",[...fullDiffArgs,"--exit-code"]);
  await cli("verify migration status",["migrate","status","--schema",join(scratch,"production/schema.prisma")]);
  const finalHistory = await history(audit); verifyHistory(finalHistory,4,approved); assert.deepEqual(finalHistory.slice(0,2),oldHistory);
  const indexes = await query(audit,`SELECT c.relname AS name,i.indisvalid AS valid,i.indisready AS ready FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('Project_categoryId_idx','ContactClick_createdAt_idx','ProjectReaction_updatedAt_idx') ORDER BY c.relname`);
  assert.equal(indexes.length,3); assert(indexes.every(row => row.valid && row.ready));
  const after = await dataState(audit), seqAfter = await query(audit,sequenceSQL), grantsAfter = await query(audit,grantsSQL), orphans = await query(audit,orphanSQL);
  assert.deepEqual(grantsAfter,grantsBefore); assert(orphans.every(row => row.orphans === 0));
  record("finalVerification", { emptySchemaDiff:true,matchingMigrations:4,indexes,oldMigrationHistoryPreserved:true,grantsAndRLSUnchanged:true,orphanRelationships:0,
    originalApplicationFieldsUnchanged:JSON.stringify(before)===JSON.stringify(after),sequencesUnchanged:JSON.stringify(seqBefore)===JSON.stringify(seqAfter),rowCounts:Object.fromEntries(after.map(row=>[row.table_name,row.rows])) });
  const client = new PrismaClient({datasourceUrl:adminRead.url.toString()});
  try {
    const summary = await client.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout='2s'");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout='30s'");
      const projects = await tx.project.findMany({include:{category:true,reactions:true,_count:{select:{views:true}}}});
      const pages = await tx.page.findMany();
      await tx.user.findMany({select:{id:true,_count:{select:{accounts:true,sessions:true}}}});
      return {projects:projects.length,pages:pages.length,legacyScalarAndRelationsReadable:true,writesPerformed:false};
    }, { timeout:35000 });
    record("productionReadSmoke",summary);
  } finally { await client.$disconnect(); }
  verifySource(); result.success = true;
} catch (error) {
  result.success = false;
  result.failure = { stage, category:error.code === "ERR_ASSERTION" ? "safety_or_equivalence_check_failed" : /^[a-z_]+$/.test(error.message) ? error.message : "operation_failed_details_withheld" };
  console.error(JSON.stringify(result.failure)); process.exitCode = 1;
} finally {
  if (containerCreated) { try { await docker("reference cleanup",["rm","-f","-v",container]); result.containerRemoved=true; } catch { result.containerRemoved=false; process.exitCode=1; } }
  if (networkCreated) { try { await docker("reference network cleanup",["network","rm",network]); result.networkRemoved=true; } catch { result.networkRemoved=false; process.exitCode=1; } }
  rmSync(scratch,{recursive:true,force:true}); result.finishedAt=new Date().toISOString(); save();
  console.log("Sanitized production reconciliation evidence saved.");
}
