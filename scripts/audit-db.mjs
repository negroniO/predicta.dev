// Read-only PostgreSQL inspection. This script deliberately never reads .env.
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { parse } from "dotenv";

const settings = parse(readFileSync(".env.audit.local"));
let url;
try {
  url = new URL(settings.AUDIT_DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
} catch { console.error("Invalid or missing AUDIT_DATABASE_URL in .env.audit.local (value withheld)"); process.exit(1); }
if (!["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode") || "require")) {
  console.error("Refusing audit: TLS is required (connection withheld)"); process.exit(1);
}
const username = decodeURIComponent(url.username);
if (username.split(".")[0] !== "predicta_audit") {
  console.error("Refusing audit: expected the dedicated predicta_audit role (connection withheld)"); process.exit(1);
}
const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  PGUSER: username, PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get("sslmode") || "require",
  PGCONNECT_TIMEOUT: "8", PGAPPNAME: "predicta_readonly_audit",
  PGOPTIONS: "-c default_transaction_read_only=on -c statement_timeout=10000 -c lock_timeout=2000 -c idle_in_transaction_session_timeout=30000",
};
// Ignore unrelated inherited libpq routing/settings.
for (const key of ["PGSERVICE", "PGSERVICEFILE", "PGHOSTADDR", "PGPASSFILE"]) delete env[key];

async function query(sql, explain = false) {
  const command = `BEGIN READ ONLY; SET LOCAL statement_timeout = '10s'; SET LOCAL lock_timeout = '2s';\n${explain ? `EXPLAIN (FORMAT JSON) ${sql}` : `SELECT COALESCE(json_agg(audit_result), '[]'::json) FROM (${sql}) audit_result`};\nROLLBACK;\n`;
  return await new Promise(resolve => {
    const child = spawn("psql", ["-X", "-q", "-t", "-A", "-w", "-v", "ON_ERROR_STOP=1"], { env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", settled = false;
    const timer = setTimeout(() => child.kill("SIGTERM"), 20000);
    const finish = result => { if (!settled) { settled = true; clearTimeout(timer); resolve(result); } };
    child.stdout.on("data", data => { stdout += data; if (stdout.length > 2_000_000) child.kill("SIGTERM"); });
    child.stderr.on("data", data => { stderr += data; });
    child.on("error", () => finish({ error: "client_unavailable" }));
    child.on("close", code => {
      if (code !== 0) {
        const reason = /password authentication failed/i.test(stderr) ? "authentication_failed"
          : /permission denied/i.test(stderr) ? "permission_denied"
          : /statement timeout/i.test(stderr) ? "statement_timeout"
          : /does not exist/i.test(stderr) ? "object_unavailable"
          : /could not translate host/i.test(stderr) ? "dns_failed"
          : /SSL|certificate/i.test(stderr) ? "tls_failed"
          : /timeout|timed out/i.test(stderr) || code === null ? "connection_or_query_timeout" : "connection_or_query_failed";
        return finish({ error: reason });
      }
      try { finish({ rows: JSON.parse(stdout.trim()) }); }
      catch { finish({ error: "unexpected_response" }); }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(command);
  });
}

const report = { capturedAt: new Date().toISOString(), mode: "BEGIN READ ONLY; SELECT; ROLLBACK", checks: {} };
async function collect(name, sql) {
  const result = await query(sql);
  // SQL definitions can contain literals; withhold these from saved evidence.
  for (const row of result.rows || []) {
    for (const key of ["definition", "default_expression", "using_expression", "check_expression"]) {
      if (typeof row[key] === "string") row[key] = row[key].replace(/'(?:[^']|'')*'/g, "'[literal]'");
    }
  }
  report.checks[name] = result;
  console.log(JSON.stringify({ check: name, ...(result.error ? { error: result.error } : { rows: result.rows.length }) }));
  return result;
}
const connection = await collect("connection", `SELECT current_user AS role, current_setting('server_version') AS server_version,
  current_setting('transaction_read_only') AS transaction_read_only, current_setting('default_transaction_read_only') AS default_read_only,
  current_setting('statement_timeout') AS statement_timeout, current_setting('lock_timeout') AS lock_timeout,
  (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()) AS tls,
  r.rolsuper AS superuser, r.rolcreaterole AS create_role, r.rolcreatedb AS create_database, r.rolreplication AS replication,
  r.rolbypassrls AS bypass_rls FROM pg_roles r WHERE r.rolname = current_user`);
if (connection.error || connection.rows[0]?.transaction_read_only !== "on" || connection.rows[0]?.role !== "predicta_audit" || ["superuser","create_role","create_database","replication","bypass_rls"].some(key => connection.rows?.[0]?.[key])) {
  writeFileSync("/tmp/predicta-live-db-audit.json", JSON.stringify(report, null, 2), { mode: 0o600 });
  process.exitCode = 1;
} else {
  if (process.argv.includes("--connection-only")) {
    writeFileSync("/tmp/predicta-live-db-audit.json", JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(connection.rows[0]));
  } else {
    if (process.argv.includes("--supplement")) {
      const earlier = JSON.parse(readFileSync("/tmp/predicta-live-db-audit.json", "utf8"));
      report.checks = { ...earlier.checks, ...report.checks };
      await supplement();
    } else { await inspect(); await supplement(); }
    writeFileSync("/tmp/predicta-live-db-audit.json", JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log("Inspection saved to /tmp/predicta-live-db-audit.json (credentials and application rows excluded)");
  }
}


async function inspect() {
  const tables = await collect("tables", `SELECT c.relname AS table_name, c.relkind AS kind,
    c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
    row_security_active(c.oid) AS rls_active_for_auditor,
    has_table_privilege(current_user,c.oid,'SELECT') AS can_select,
    has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') AS any_write_privilege,
    pg_total_relation_size(c.oid)::bigint AS total_bytes, c.reltuples::bigint AS estimated_rows
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`);
  await collect("columns", `SELECT c.relname AS table_name, a.attname AS column_name,
    format_type(a.atttypid,a.atttypmod) AS data_type, a.attnotnull AS not_null,
    pg_get_expr(d.adbin,d.adrelid) AS default_expression
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
    WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
    ORDER BY c.relname,a.attnum`);
  await collect("constraints", `SELECT c.relname AS table_name, con.conname AS constraint_name,
    con.contype AS kind, con.convalidated AS validated, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' ORDER BY c.relname, con.conname`);
  await collect("indexes", `SELECT c.relname AS table_name, i.relname AS index_name, x.indisunique AS is_unique,
    x.indisvalid AS is_valid, x.indisready AS is_ready, pg_get_indexdef(i.oid) AS definition,
    pg_relation_size(i.oid)::bigint AS bytes
    FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,i.relname`);
  await collect("policies", `SELECT schemaname, tablename, policyname, permissive, roles, cmd,
    qual AS using_expression, with_check AS check_expression FROM pg_policies
    WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname`);
  await collect("api_role_table_access", `SELECT r.rolname AS role, c.relname AS table_name,
    has_table_privilege(r.oid,c.oid,'SELECT') AS can_select,
    has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,
    has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,
    has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,
    c.relrowsecurity AS rls_enabled
    FROM pg_roles r CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE r.rolname IN ('anon','authenticated','service_role','predicta_audit')
    AND n.nspname='public' AND c.relkind IN ('r','p') ORDER BY r.rolname,c.relname`);
  await collect("role_memberships", `SELECT granted.rolname AS granted_role, member.rolname AS member_role, m.admin_option
    FROM pg_auth_members m JOIN pg_roles granted ON granted.oid=m.roleid JOIN pg_roles member ON member.oid=m.member
    WHERE member.rolname IN ('predicta_audit','anon','authenticated','service_role') ORDER BY member.rolname,granted.rolname`);
  await collect("schema_access", `SELECT n.nspname AS schema, has_schema_privilege(current_user,n.oid,'USAGE') AS can_use,
    has_schema_privilege(current_user,n.oid,'CREATE') AS can_create FROM pg_namespace n
    WHERE n.nspname IN ('public','auth','storage') ORDER BY n.nspname`);
  await collect("functions", `SELECT n.nspname AS schema, p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments, p.prosecdef AS security_definer,
    p.provolatile AS volatility, has_function_privilege(current_user,p.oid,'EXECUTE') AS auditor_can_execute,
    has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' ORDER BY p.proname,p.oid`);
  await collect("triggers", `SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled AS enabled,
    n2.nspname AS function_schema, p.proname AS function_name
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace n2 ON n2.oid=p.pronamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname,t.tgname`);
  await collect("table_statistics", `SELECT relname AS table_name, seq_scan, idx_scan, n_live_tup, n_dead_tup,
    n_mod_since_analyze, last_autovacuum, last_autoanalyze FROM pg_stat_user_tables
    WHERE schemaname='public' ORDER BY relname`);
  await collect("index_statistics", `SELECT relname AS table_name, indexrelname AS index_name, idx_scan, idx_tup_read, idx_tup_fetch
    FROM pg_stat_user_indexes WHERE schemaname='public' ORDER BY relname,indexrelname`);
  await collect("connection_statistics", `SELECT state, count(*)::int AS connections,
    count(*) FILTER (WHERE wait_event_type='Lock')::int AS waiting_for_lock
    FROM pg_stat_activity WHERE datname=current_database() GROUP BY state`);
  await collect("database_statistics", `SELECT numbackends, deadlocks, temp_files, temp_bytes,
    blks_hit, blks_read, stats_reset FROM pg_stat_database WHERE datname=current_database()`);
  await collect("extensions", `SELECT e.extname, e.extversion, n.nspname AS schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY e.extname`);
  const map = new Map((tables.rows || []).map(row => [row.table_name, row]));
  const readable = (...names) => names.every(name => map.get(name)?.can_select && !map.get(name)?.rls_active_for_auditor);
  const columns = report.checks.columns.rows || [];
  const has = (table, column) => columns.some(row => row.table_name===table && row.column_name===column);
  const safeTables = ['Project','Category','Page','ProjectView','ProjectReaction','ContactClick','NewsletterSubscriber','Testimonial','User','Account','Session','VerificationToken'];
  for (const table of safeTables) {
    if (readable(table)) await collect(`count_${table}`, `SELECT count(*)::bigint AS rows FROM public."${table}"`);
    else report.checks[`count_${table}`] = { skipped: !map.has(table) ? "table_missing" : "permissions_or_rls_restrict_visibility" };
  }
  if (readable('_prisma_migrations')) await collect('migration_history', `SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count,
    checksum, logs IS NOT NULL AND logs<>'' AS has_logs FROM public."_prisma_migrations" ORDER BY started_at`);
  else report.checks.migration_history={skipped:map.has('_prisma_migrations')?'permissions_or_rls_restrict_visibility':'table_missing'};
  if (readable('Project') && has('Project','status')) await collect('project_integrity', `SELECT
    count(*) FILTER (WHERE status NOT IN ('Completed','In Progress','Draft')) AS invalid_status,
    count(*) FILTER (WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') AS invalid_slug,
    count(*) FILTER (WHERE trim(title)='') AS blank_title,
    count(*) FILTER (WHERE "updatedAt" < "createdAt") AS timestamp_reversed,
    count(*) FILTER (WHERE "updatedAt" > now()+interval '1 day') AS future_timestamp
    FROM public."Project"`);
  if (readable('Page')) await collect('page_integrity', `SELECT
    count(*) FILTER (WHERE status NOT IN ('draft','published')) AS invalid_status,
    count(*) FILTER (WHERE slug IN ('admin','api','projects','rss','atom')) AS reserved_slug,
    count(*) FILTER (WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') AS invalid_slug,
    count(*) FILTER (WHERE "updatedAt" < "createdAt") AS timestamp_reversed FROM public."Page"`);
  for (const [child,parent,column] of [['ProjectView','Project','projectId'],['ProjectReaction','Project','projectId'],['Account','User','userId'],['Session','User','userId'],['Project','Category','categoryId']]) {
    if (readable(child,parent) && has(child,column)) await collect(`orphans_${child}_${parent}`, `SELECT count(*)::bigint AS orphan_rows FROM public."${child}" c LEFT JOIN public."${parent}" p ON p.id=c."${column}" WHERE c."${column}" IS NOT NULL AND p.id IS NULL`);
  }
  for (const [table,column] of [['Project','slug'],['Page','slug'],['Category','slug'],['NewsletterSubscriber','email']]) {
    if (readable(table)) await collect(`duplicates_${table}`, `SELECT count(*) AS duplicate_groups FROM (SELECT "${column}" FROM public."${table}" GROUP BY "${column}" HAVING count(*)>1) d`);
  }
  if (readable('Project') && has('Project','category') && has('Project','categoryId')) await collect('category_backfill', `SELECT count(*) FILTER (WHERE nullif(trim(category),'') IS NOT NULL AND "categoryId" IS NULL) AS legacy_category_without_relation FROM public."Project"`);
  if (readable('ProjectReaction')) await collect('reaction_integrity', `SELECT count(*) FILTER (WHERE kind NOT IN ('like','dislike')) AS invalid_kind, count(*) FILTER (WHERE trim("visitorId")='') AS blank_visitor_id FROM public."ProjectReaction"`);
  if (readable('Session')) await collect('session_expiry', `SELECT count(*) FILTER (WHERE expires<now()) AS expired_rows, count(*) FILTER (WHERE expires>=now()) AS unexpired_rows FROM public."Session"`);
}


async function supplement() {
  await collect('table_owners', `SELECT c.relname AS table_name,r.rolname AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname`);
  await collect('default_privileges', `SELECT owner.rolname AS creator_role, coalesce(n.nspname,'all_schemas') AS schema,
    d.defaclobjtype AS object_type, coalesce(grantee.rolname,'PUBLIC') AS grantee, a.privilege_type
    FROM pg_default_acl d JOIN pg_roles owner ON owner.oid=d.defaclrole
    LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a LEFT JOIN pg_roles grantee ON grantee.oid=a.grantee
    WHERE d.defaclnamespace=0 OR n.nspname='public' ORDER BY creator_role,schema,object_type,grantee,privilege_type`);
  await collect('column_level_api_grants', `SELECT c.relname AS table_name,r.rolname AS role,a.attname AS column_name,
    has_column_privilege(r.oid,c.oid,a.attnum,'SELECT') AS can_select,
    has_column_privilege(r.oid,c.oid,a.attnum,'INSERT') AS can_insert,
    has_column_privilege(r.oid,c.oid,a.attnum,'UPDATE') AS can_update
    FROM pg_roles r CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
    WHERE r.rolname IN ('anon','authenticated') AND n.nspname='public' AND c.relkind IN ('r','p')
    AND (has_column_privilege(r.oid,c.oid,a.attnum,'SELECT') OR has_column_privilege(r.oid,c.oid,a.attnum,'INSERT') OR has_column_privilege(r.oid,c.oid,a.attnum,'UPDATE'))`);
  await collect('views', `SELECT n.nspname AS schema,c.relname AS view_name,c.relkind,
    coalesce('security_invoker=true'=ANY(c.reloptions),false) AS security_invoker,
    has_table_privilege('anon',c.oid,'SELECT') AS anon_can_select,
    has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_can_select
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('v','m')`);
  await collect('storage_visibility', `SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
    has_table_privilege(current_user,c.oid,'SELECT') AS auditor_can_select
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='storage' AND c.relname IN ('buckets','objects')`);
  await collect('statistics_visibility', `SELECT pg_has_role(current_user,'pg_read_all_stats','MEMBER') AS all_stats_member,
    has_schema_privilege(current_user,'extensions','USAGE') AS extensions_usage,
    coalesce((SELECT has_table_privilege(current_user,c.oid,'SELECT') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='extensions' AND c.relname='pg_stat_statements'),false) AS statement_stats_select`);
  await collect('slug_shape', `SELECT count(*) FILTER (WHERE slug<>lower(slug)) AS contains_uppercase,
    count(*) FILTER (WHERE slug ~ '[[:space:]]') AS contains_whitespace,
    count(*) FILTER (WHERE slug ~ '[^a-zA-Z0-9-]') AS contains_other_characters,
    count(*) FILTER (WHERE slug LIKE '%--%' OR slug LIKE '-%' OR slug LIKE '%-') AS malformed_hyphens,
    count(*) FILTER (WHERE length(slug)>160) AS too_long FROM public."Project"`);
  const plans = {
    public_projects: `SELECT id,title FROM public."Project" WHERE status IN ('Completed','In Progress') ORDER BY "sortOrder",year DESC,id LIMIT 50`,
    recent_views: `SELECT id,"createdAt",path FROM public."ProjectView" WHERE "createdAt">=timestamp '2026-09-06' AND "createdAt"<timestamp '2026-10-06' ORDER BY "createdAt" DESC,id DESC LIMIT 20`,
    click_analytics: `SELECT href,count(*) FROM public."ContactClick" WHERE "createdAt">=timestamp '2026-09-06' AND "createdAt"<timestamp '2026-10-06' GROUP BY href ORDER BY count(*) DESC LIMIT 50`
  };
  for (const [name,sql] of Object.entries(plans)) {
    report.checks[`plan_${name}`]=await query(sql,true);
    console.log(JSON.stringify({check:`plan_${name}`,error:report.checks[`plan_${name}`].error || null}));
  }
}
